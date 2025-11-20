import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- Import your existing agent router ---
# This assumes your 'agent' folder is in the same 'backend' directory
# and your Python path is set up correctly.
from agent.router import route_query
from db import save_thread, save_message, get_user_threads, get_thread_messages, delete_thread
import asyncio
asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# ----------------------------
#      1. INITIALIZATION
# ----------------------------

app = FastAPI(
    title="L.A.R.A. Backend API",
    description="API for the Legal Analysis & Research Assistant",
    version="1.0.0",
)

# --- Add CORS Middleware ---
# This is crucial to allow your React frontend (running on a different port)
# to communicate with this backend.
app.add_middleware(
    CORSMiddleware,
    # Adjust allow_origins to your React app's URL in production
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------
#      2. PYDANTIC MODELS
# ----------------------------

# These models define the expected structure of your API request body.
# FastAPI uses them to validate incoming data and generate documentation.

class QueryRequest(BaseModel):
    user_query: str
    role: str
    thread_id: str
    user_id: str

class QueryResponse(BaseModel):
    final_analysis: str
    thread_id: str

class ChatHistoryRequest(BaseModel):
    user_id: str

class ThreadMessagesRequest(BaseModel):
    thread_id: str

class SaveThreadRequest(BaseModel):
    user_id: str
    thread_id: str
    title: str = None


# ----------------------------
#      3. API ENDPOINTS
# ----------------------------

@app.get("/")
def read_root():
    """A simple endpoint to check if the server is running."""
    return {"message": "Welcome to the L.A.R.A. Backend API"}


@app.post("/process_query", response_model=QueryResponse)
async def process_legal_query(request: QueryRequest):
    """
    Receives a legal query from the frontend, processes it using the agent router,
    and returns the final analysis.
    """

    print(f"Received query for thread_id: {request.thread_id}")

    try:
        # ---------------------------------------------
        # 1) SAVE THREAD BEFORE LONG PROCESSING STARTS
        # ---------------------------------------------
        # This ensures the thread exists instantly,
        # so refreshing the frontend will NEVER show empty history.
        save_thread(
            user_id=request.user_id,
            thread_id=request.thread_id,
            title=request.user_query[:50]
        )

        # ---------------------------------------------
        # 2) LONG PROCESSING BEGINS
        # ---------------------------------------------
        result = route_query(
            role=request.role,
            user_query=request.user_query,
            thread_id=request.thread_id,
        )

        # Extract the final analysis from the result dictionary
        final_analysis = result.get(
            "final_analysis",
            "Sorry, I couldn't generate a final analysis."
        )

        # ---------------------------------------------
        # 3) SAVE MESSAGES
        # ---------------------------------------------
        save_message(request.thread_id, 'user', request.user_query)
        save_message(request.thread_id, 'bot', final_analysis)

        return QueryResponse(
            final_analysis=final_analysis,
            thread_id=request.thread_id
        )

    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing your request: {e}"
        )


@app.post("/get_chat_history")
async def get_chat_history(request: ChatHistoryRequest):
    """Get all threads for a user."""
    try:
        threads = get_user_threads(request.user_id)
        return {"threads": threads}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching chat history: {e}")

@app.post("/get_thread_messages")
async def get_thread_messages_endpoint(request: ThreadMessagesRequest):
    """Get all messages for a thread."""
    try:
        messages = get_thread_messages(request.thread_id)
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching thread messages: {e}")

@app.post("/save_thread")
async def save_thread_endpoint(request: SaveThreadRequest):
    """Save a thread."""
    try:
        save_thread(request.user_id, request.thread_id, request.title)
        return {"message": "Thread saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving thread: {e}")

@app.delete("/delete_thread/{thread_id}")
async def delete_thread_endpoint(thread_id: str):
    """Delete a thread and its messages."""
    try:
        delete_thread(thread_id)
        return {"message": "Thread deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting thread: {e}")

# ----------------------------
#      4. SERVER EXECUTION (for local testing)
# ----------------------------

# This part allows you to run the file directly with `python app.py` for testing,
# but the standard way to run a FastAPI app is with Uvicorn.
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)