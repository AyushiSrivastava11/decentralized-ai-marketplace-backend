import json
import os

def main():
    input_json = os.getenv("INPUT_JSON", "{}")
    data = json.loads(input_json)
    
    # Dummy logic
    input_text = data.get("text", "")
    result = {"reversed": input_text[::-1]} 

    print(json.dumps(result))  

if __name__ == "__main__":
    main()
