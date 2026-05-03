# PhishVigil Chrome Extension
![Status](https://img.shields.io/badge/Status-Alpha-orange)

Chrome extension for client-side phishing inference

### Key Features
- Listen for tabs URL change
- Send every URL to **local** model
- If URL is marked phishing shows warning popup


### Usage
1. Clone repo
   ```bash
   git clone https://github.com/PhishVigil/phishvigil.git
   ```

2. Train and export `.onnx` model. Follow [ML pipeline guide](../ml/README.md#usage)

3. Build extension
   ```bash
   cd extension/
   npm install
   npm run build
   ```

4. In Google Chrome
   * Go to `Extensions` menu
   * Toggle `Dev Mode` ON
   * Hit `Load Unpacked Extension`
   * Choose `phishvigil/extension/dist/` directory