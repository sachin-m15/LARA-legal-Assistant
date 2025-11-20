from dotenv import load_dotenv
from agent.citizen_agent import app as citizen_app
from agent.lawyer_agent import lawyer_app as lawyer_app
from db import get_thread_messages

load_dotenv()


def route_query(role: str, user_query: str, thread_id: str):
    """
    Routes the user's query to the correct agent (citizen or lawyer)
    and returns ONLY the new messages / final output.

    IMPORTANT:
    - This function must NOT save messages into the DB.
    - Only /process_query should save user + bot messages.
    """

    # --------------------------------------------------------
    # 1. Load existing messages from DB to build chat history
    # --------------------------------------------------------
    existing_messages = get_thread_messages(thread_id)

    # Convert database messages to the format the LLM agents expect
    chat_history = []
    for msg in existing_messages:
        if msg['role'] == 'user':
            chat_history.append({"role": "user", "content": msg['content']})
        elif msg['role'] == 'bot':
            chat_history.append({"role": "assistant", "content": msg['content']})

    # --------------------------------------------------------
    # 2. Build initial state for the agent
    # --------------------------------------------------------
    input_state = {
        "query": user_query,
        "chat_history": chat_history,
        "intermediate_steps": [],
        "role": role,  # Pass the role to agent
    }

    # Normalize role
    normalized_role = (role or "").strip().lower()

    # --------------------------------------------------------
    # 3. Route to the correct agent
    # --------------------------------------------------------
    if normalized_role == "lawyer":
        print("Routing to Lawyer Agent...")
        result = lawyer_app.invoke(
            input_state,
            config={"configurable": {"thread_id": thread_id}, "recursion_limit": 50}
        )

    else:  # default to citizen agent
        print("Routing to Citizen Agent...")
        result = citizen_app.invoke(
            input_state,
            config={"configurable": {"thread_id": thread_id}, "recursion_limit": 50}
        )

    # --------------------------------------------------------
    # 4. IMPORTANT: Do NOT save messages here.
    # Saving happens ONLY in process_query in app.py.
    # --------------------------------------------------------

    return result