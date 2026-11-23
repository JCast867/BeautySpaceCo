import { createBrowserRouter } from "react-router";

import { initializeLanguage } from "../locales/bootstrap.ts";
import { routes } from "./routes.ts";

// Set the initial URL before the router reads it.
initializeLanguage();

export const router = createBrowserRouter(routes);
