from dotenv import load_dotenv
from agent.citizen_agent import app as citizen_app
from agent.lawyer_agent import lawyer_app as lawyer_app
from db import save_message, get_thread_messages

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
    # Load existing chat history for the thread
    existing_messages = get_thread_messages(thread_id)
    chat_history = []
    for msg in existing_messages:
        if msg['role'] == 'user':
            chat_history.append({"role": "user", "content": msg['content']})
        elif msg['role'] == 'bot':
            chat_history.append({"role": "assistant", "content": msg['content']})

    # Create the initial state with the query and role
    input_state = {
        "query": user_query,
        "chat_history": chat_history,
        "intermediate_steps": [],
        "role": role,  # <-- Pass the role into the state
    }

    # Normalize role to avoid case-sensitivity issues between frontend and backend
    normalized_role = (role or '').strip().lower()

    if normalized_role == "lawyer":
        print("Routing to Lawyer Agent...")
        result = lawyer_app.invoke(
            input_state, config={"configurable": {"thread_id": thread_id}, "recursion_limit": 50}
        )
    elif normalized_role == "citizen":
        print("Routing to Citizen Agent...")
        result = citizen_app.invoke(
            input_state, config={"configurable": {"thread_id": thread_id}, "recursion_limit": 50}
        )
    else:
        # If role is unrecognized, default to Citizen behavior but log a warning.
        print(f"Warning: Unrecognized role '{role}' received. Defaulting to Citizen Agent.")
        result = citizen_app.invoke(
            input_state, config={"configurable": {"thread_id": thread_id}, "recursion_limit": 50}
        )

    # Save messages to database after processing
    from db import save_message
    for message in result.get('chat_history', []):
      save_message(
        thread_id,
        message.get("role") or message.get("type", "assistant"),  # fallback
        message.get("content", "")
    )


    return result
