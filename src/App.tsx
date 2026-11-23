import { RouterProvider } from "react-router";

import { router } from "./routes/router.ts";

export function App() {
	return <RouterProvider router={router} />;
}
