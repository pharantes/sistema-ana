import dbConnect from "@/lib/mongoose";

function logError(error) {
  try {
    const errorMessage = error && error.stack ? error.stack : String(error);
    process?.stderr?.write(errorMessage + "\n");
  } catch {
    // Ignore logging errors
  }
}

function getErrorStatus(error) {
  return error.status || 500;
}

function getErrorMessage(error) {
  return error.message || "Server error";
}

/**
 * Generic API handler wrapper that provides database connection and error handling.
 * Supports multiple HTTP methods with individual handler functions.
 * 
 * Example usage:
 * export default apiHandler({ POST: createCampaign, GET: getCampaigns })
 */
export function apiHandler(handlers) {
  return async function handler(request, response) {
    const httpMethod = request.method?.toUpperCase();
    const handlerFunction = handlers[httpMethod];

    if (!handlerFunction) {
      return response.status(405).json({ error: "Method not allowed" });
    }

    try {
      await dbConnect();
      await handlerFunction(request, response);
    } catch (error) {
      logError(error);
      const statusCode = getErrorStatus(error);
      const errorMessage = getErrorMessage(error);
      response.status(statusCode).json({ error: errorMessage });
    }
  };
}
