#!/bin/bash

# Initialize firewall settings for Claude Code
echo "Initializing firewall settings for Claude Code..."

# Check if running in a container
if [ -f /.dockerenv ]; then
    echo "Running in a container environment"
    
    # Set up any required firewall rules or network configurations
    # This is a placeholder for future firewall configurations
    echo "Firewall initialization complete"
else
    echo "Not running in a container, skipping firewall initialization"
fi