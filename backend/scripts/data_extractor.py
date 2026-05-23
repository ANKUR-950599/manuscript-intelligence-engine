import os
import json
import pandas as pd
import numpy as np

def run_extraction():
    print("🚀 Initializing Multi-Dataset Conversational Intelligence Harvest...")
    
    parquet_path = r"C:\Users\DELL\Downloads\blog_automation\backend\scripts\data\train-00000-of-00086.parquet"
    output_path = r"C:\Users\DELL\Downloads\blog_automation\backend\scripts\filtered_conversations.json"
    
    if not os.path.exists(parquet_path):
        print(f"❌ Error: Local file not found at {parquet_path}")
        return

    print(f"📡 Scanning for local offline dataset asset at: {parquet_path}")
    print("💾 Local file found. Initializing PyArrow Ingestion...")
    
    # Load the parquet dataframe
    df = pd.read_parquet(parquet_path)
    raw_row_count = len(df)
    print(f"📋 Loaded {raw_row_count} raw rows from local shard. Executing heuristic matching...")
    
    # Broad accounting, finance, and professional training keyword anchors
    keywords = [
        "tally", "accounting", "gst billing", "tax filing", "balance sheet", 
        "bookkeeping", "ledger", "commerce graduate", "chartered accountant",
        "b.com", "corporate tax", "invoice validation", "excel matching"
    ]
    
    harvested_records = []
    
    for idx, row in df.iterrows():
        conversation_turns = row.get('conversation')
        
        # Verify the cell contains an array/list of elements
        if conversation_turns is None or not isinstance(conversation_turns, (list, np.ndarray)):
            continue
            
        full_conversation_text = ""
        structured_turns = []
        
        # Iterate over each individual turn inside the conversation array
        for turn in conversation_turns:
            if not isinstance(turn, dict):
                continue
                
            content = turn.get('content', '') or ''
            role = turn.get('role', 'unknown')
            
            full_conversation_text += f" {content.lower()}"
            structured_turns.append({
                "role": role,
                "content": content
            })
            
        # Match using keywords against the combined text of all turns
        if any(keyword in full_conversation_text for keyword in keywords):
            harvested_records.append({
                "source": "wildchat_local_shard",
                "conversationId": row.get('conversation_hash', str(idx)),
                "userRawPrompt": structured_turns[0]["content"] if len(structured_turns) > 0 else "",
                "assistantResponse": structured_turns[1]["content"] if len(structured_turns) > 1 else "",
                "metadata": {
                    "model": str(row.get('model', 'unknown')),
                    "language": str(row.get('language', 'unknown')),
                    "country": str(row.get('country', 'unknown')),
                    "state": str(row.get('state', 'unknown')),
                    "turn_count": int(row.get('turn', len(structured_turns)))
                }
            })

    print(f"✅ Successfully harvested {len(harvested_records)} high-yield matching segments from local shard.")
    
    # Save formatted array out to disk
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(harvested_records, f, indent=2, ensure_ascii=False)
        
    print(f"🎯 Unified ETL execution complete. Saved {len(harvested_records)} records to: {output_path}")

if __name__ == "__main__":
    run_extraction()