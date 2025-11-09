import os
from dotenv import load_dotenv
from typing import TypedDict, Annotated, List, Any
import operator
from langchain_core.messages import BaseMessage
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

# --- 1. UPDATED IMPORTS ---
from legal_rag.query_rewriter import rewrite_query
from legal_rag.retrieval import perform_research
from legal_rag.summarizer import (
    summarize_and_reflect_lawyer, 
    generate_lawyer_analysis, 
    evaluate_hybrid_response,
    combine_analysis_and_evaluation  # <-- ADD THIS IMPORT
)
# -------------------------

load_dotenv()

# --- Configuration & Validation ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

if not TAVILY_API_KEY or not GROQ_API_KEY:
    raise ValueError(
        "API keys for Tavily and Grok are not set. Please add them to your .env file."
    )

MAX_RESEARCH_CYCLES = 5

# --- State Management with LangGraph ---
class LawyerAgentState(TypedDict):
    query: str
    intermediate_steps: Annotated[List[Any], operator.add]
    web_search_results: str
    faiss_search_results: str
    final_analysis: str
    research_complete: bool
    chat_history: List[BaseMessage]
    sources: Annotated[List[dict], operator.add]
    role: str
    research_cycles: Annotated[int, operator.add]
    evaluation_score: str

# --- Decision Nodes ---
def decide_lawyer_next_step(state: LawyerAgentState):
    research_cycles = state.get("research_cycles", 0)
    print(f"---DECISION: Entering cycle {research_cycles}---")

    if state.get("research_complete", False):
        print("---DECISION: Research complete. Proceeding to final analysis.---")
        return "final_analysis"

    if research_cycles >= MAX_RESEARCH_CYCLES:
        print(f"---DECISION: Max research cycles ({MAX_RESEARCH_CYCLES}) reached. Forcing final analysis.---")
        return "final_analysis"
    
    else:
        print(f"---DECISION: Research incomplete. Restarting with new research loop.---")
        return "perform_research"

def increment_counter(state: LawyerAgentState):
    return {"research_cycles": 1}

# --- Build the LangGraph (UPDATED WIRING) ---
lawyer_workflow = StateGraph(LawyerAgentState)

# --- 2. ADD ALL NODES ---
lawyer_workflow.add_node("rewrite_query", rewrite_query)
lawyer_workflow.add_node("perform_research", perform_research)
lawyer_workflow.add_node("summarize_and_reflect_lawyer", summarize_and_reflect_lawyer)
lawyer_workflow.add_node("final_analysis", generate_lawyer_analysis)
lawyer_workflow.add_node("increment_counter", increment_counter)
lawyer_workflow.add_node("evaluate_hybrid_response", evaluate_hybrid_response)
lawyer_workflow.add_node("combine_analysis_and_evaluation", combine_analysis_and_evaluation) # <-- ADD THIS NODE

# --- Define the graph flow ---
lawyer_workflow.set_entry_point("rewrite_query")
lawyer_workflow.add_edge("rewrite_query", "perform_research")
lawyer_workflow.add_edge("perform_research", "summarize_and_reflect_lawyer")
lawyer_workflow.add_edge("summarize_and_reflect_lawyer", "increment_counter")

lawyer_workflow.add_conditional_edges(
    "increment_counter",
    decide_lawyer_next_step,
    {
        "perform_research": "perform_research",
        "final_analysis": "final_analysis",
    },
)

# --- 3. UPDATED FINAL EDGES ---
lawyer_workflow.add_edge("final_analysis", "evaluate_hybrid_response")
lawyer_workflow.add_edge("evaluate_hybrid_response", "combine_analysis_and_evaluation") # <-- Point to new node
lawyer_workflow.add_edge("combine_analysis_and_evaluation", END) # <-- Point new node to END
# --------------------------

checkpointer = MemorySaver()
lawyer_app = lawyer_workflow.compile(checkpointer=checkpointer)