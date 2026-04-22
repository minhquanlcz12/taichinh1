---
description: Scaffold a new "Premium Modern Dark" web project structure.
---

1. Create directory structure:
`mkdir css js img assets`

// turbo
2. Create `index.html` with premium boilerplate:
```html
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Premium App</title>
    <link rel="stylesheet" href="css/style.css?v=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>
<body class="dark-theme">
    <div id="app" class="glass-container">
        <h1>Welcome to your Premium App</h1>
    </div>
    <script src="js/db.js?v=1.0"></script>
    <script src="js/app.js?v=1.0"></script>
</body>
</html>
```

// turbo
3. Create `css/style.css` with core design tokens:
```css
:root {
    --primary: #00f0ff;
    --bg-dark: #050a14;
    --card-bg: rgba(255, 255, 255, 0.03);
    --border: rgba(255, 255, 255, 0.1);
    --text: #ffffff;
}

body {
    background: var(--bg-dark);
    color: var(--text);
    font-family: 'Outfit', sans-serif;
    margin: 0;
}

.glass-card {
    background: var(--card-bg);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
}
```

4. Ask user for Firebase configuration to initialize `js/db.js`.
