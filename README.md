# EzzCustoms Structured Clothing Logic

This version fixes the shirt/pants logic.

Major changes:
- Shirt and Pants no longer use AI texture chopping.
- Shirt generates a structured hoodie layout:
  - front zipper
  - drawstrings
  - pocket
  - simple back panel
  - sleeve accents
  - cuffs and hem
- Pants generates structured jeans:
  - minimal torso/waistband only
  - leg seams
  - pockets
  - ripped knee details
  - optional chains/stars
- Panels overfill by 3-5px to prevent white gaps.
- Final output is a clean 585x559 transparent Roblox classic clothing upload PNG.

OpenAI is still used for T-Shirt and UGC item generations only.
Required Netlify env variable for AI features:
OPENAI_API_KEY = your OpenAI API key
