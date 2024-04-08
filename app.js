// Page.js
import page from "page.js";
import preRender from "./src/middleware/prerender";

// Define routes
page('/', preRender , () => {});

// Error page
page('*', function (ctx, next) {
    console.error("Page not found:", ctx.path);
});

// Start routing
page.start();
