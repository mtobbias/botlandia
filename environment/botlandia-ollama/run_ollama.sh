#!/bin/bash

echo "Starting Ollama server..."
/bin/ollama serve &
sleep 5
echo "==================================================="
echo "======              BOTLANDIA              ========"
echo "==================================================="
echo "======          AGUARDE O DOWNLOAD         ========"
echo "==================================================="
/bin/ollama run llama3.2