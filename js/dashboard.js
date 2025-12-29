// ================== CONFIG ==================
const SHEETS = ["Users", "Contributions", "Penalties", "Loans"];

// ================== DO GET ==================
function doGet(e) {
  return ContentService.createTextOutput("API is running. Use POST requests for data.")
    .setMimeType(ContentService.MimeType.TEXT);
}

// ================== DO POST ==================
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const sheetName = params.sheet;
    const action = params.action;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return jsonResponse({ success: false, message: "Sheet does not exist" });

    switch (action) {
      case "list":
        return listItems(sheet);
      case "add":
        return addItem(sheet, params);
      case "update":
        return updateItem(sheet, params);
      case "register":
        return registerUser(sheet, params);
      case "login":
        return loginUser(sheet, params);
      default:
        return jsonResponse({ success: false, message: "Action not recognized" });
    }

  } catch (err) {
    return jsonResponse({ success: false, message: err.toString() });
  }
}

// ================== LIST ITEMS ==================
function listItems(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data.shift() || [];
  const items = data.map(row => {
    let obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
  return jsonResponse({ success: true, items });
}

// ================== ADD ITEM ==================
function addItem(sheet, obj) {
  const headers = sheet.getDataRange().getValues()[0] || [];
  let row = headers.map(h => obj[h] || "");
  sheet.appendRow(row);
  return jsonResponse({ success: true });
}

// ================== UPDATE ITEM ==================
function updateItem(sheet, obj) {
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  if (!headers.includes("id")) return jsonResponse({ success: false, message: "No 'id' column in sheet" });

  const idIndex = headers.indexOf("id");
  let found = false;

  data.forEach((row, rIdx) => {
    if (row[idIndex] == obj.id) {
      headers.forEach((h, cIdx) => {
        if (obj[h] !== undefined) row[cIdx] = obj[h];
      });
      sheet.getRange(rIdx + 2, 1, 1, row.length).setValues([row]);
      found = true;
    }
  });

  if (found) return jsonResponse({ success: true });
  else return jsonResponse({ success: false, message: "Item with that ID not found" });
}

// ================== REGISTER USER ==================
function registerUser(sheet, params) {
  const { email, password, role } = params;
  if (!email || !password || !role) return jsonResponse({ success: false, message: "All fields required" });

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const emailIndex = headers.indexOf("email");

  const exists = data.some(row => row[emailIndex] === email);
  if (exists) return jsonResponse({ success: false, message: "User already exists" });

  let row = headers.map(h => {
    if (h === "email") return email;
    if (h === "password") return password;
    if (h === "role") return role;
    return "";
  });
  sheet.appendRow(row);
  return jsonResponse({ success: true });
}

// ================== LOGIN USER ==================
function loginUser(sheet, params) {
  const { email, password } = params;
  if (!email || !password) return jsonResponse({ success: false, message: "Email and password required" });

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const emailIndex = headers.indexOf("email");
  const passwordIndex = headers.indexOf("password");
  const roleIndex = headers.indexOf("role");

  const userRow = data.find(row => row[emailIndex] === email && row[passwordIndex] === password);
  if (!userRow) return jsonResponse({ success: false, message: "Invalid login credentials" });

  return jsonResponse({ success: true, role: userRow[roleIndex] });
}

// ================== JSON RESPONSE HELPER ==================
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
