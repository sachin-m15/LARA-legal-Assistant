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
    summarize_and_reflect, 
    generate_final_analysis, 
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

MAX_RESEARCH_CYCLES = 3

# --- State Management with LangGraph ---
class AgentState(TypedDict):
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
def decide_next_step(state: AgentState):
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

def increment_counter(state: AgentState):
    return {"research_cycles": 1}

# --- Build the LangGraph (UPDATED WIRING) ---
workflow = StateGraph(AgentState)

# --- 2. ADD ALL NODES ---
workflow.add_node("rewrite_query", rewrite_query)
workflow.add_node("perform_research", perform_research)
workflow.add_node("summarize_and_reflect", summarize_and_reflect)
workflow.add_node("final_analysis", generate_final_analysis)
workflow.add_node("increment_counter", increment_counter)
workflow.add_node("evaluate_hybrid_response", evaluate_hybrid_response)
workflow.add_node("combine_analysis_and_evaluation", combine_analysis_and_evaluation) # <-- ADD THIS NODE

# --- Define the graph flow ---
workflow.set_entry_point("rewrite_query")
workflow.add_edge("rewrite_query", "perform_research")
workflow.add_edge("perform_research", "summarize_and_reflect")
workflow.add_edge("summarize_and_reflect", "increment_counter")

workflow.add_conditional_edges(
    "increment_counter",
    decide_next_step,
    {
        "perform_research": "perform_research",
        "final_analysis": "final_analysis",
    },
)

# --- 3. UPDATED FINAL EDGES ---
workflow.add_edge("final_analysis", "evaluate_hybrid_response")
workflow.add_edge("evaluate_hybrid_response", "combine_analysis_and_evaluation") # <-- Point to new node
workflow.add_edge("combine_analysis_and_evaluation", END) # <-- Point new node to END
# --------------------------

checkpointer = MemorySaver()
app = workflow.compile(checkpointer=checkpointer)

def retrieve_all_threads():
    all_threads = set()
    for checkpoint in checkpointer.list(None):
        all_threads.add(checkpoint.config["configurable"]["thread_id"])
    return list(all_threads)