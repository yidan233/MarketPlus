#!/usr/bin/env python3
import sys
import os

# Get the absolute path to the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Add the current directory to Python path so 'app' can be found
sys.path.insert(0, current_dir)

# Now import and run - use the same pattern as locally
from app.main import main

if __name__ == "__main__":
    # Set sys.argv to simulate --mode api
    sys.argv = [sys.argv[0], '--mode', 'api']
    main()
