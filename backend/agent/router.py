from dotenv import load_dotenv
from agent.citizen_agent import app as citizen_app
from agent.lawyer_agent import lawyer_app as lawyer_app

load_dotenv()


# --- Routing Logic ---
def route_query(role: str, user_query: str, thread_id: str):
    """
    Routes the user's query to the correct agent based on their selected role.

    Args:
        role (str): The role selected by the user ("Common Citizen" or "Lawyer").
        user_query (str): The user's input query.
        thread_id (str): The unique identifier for the conversation thread.

    Returns:
        The response from the invoked agent.
    """
    # Create the initial state with the query and role
    input_state = {
        "query": user_query,
        "chat_history": [],
        "intermediate_steps": [],
        "role": role,  # <-- Pass the role into the state
    }

    if role == "Lawyer":
        print("Routing to Lawyer Agent...")
        return lawyer_app.invoke(
            input_state, config={"configurable": {"thread_id": thread_id}, "recursion_limit": 50}
        )
    else:
        print("Routing to Citizen Agent...")
        return citizen_app.invoke(
            input_state, config={"configurable": {"thread_id": thread_id}, "recursion_limit": 50}
        )
