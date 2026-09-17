export async function evaluateJsonPath(jsonString: string, path: string): Promise<{ success: true; data: unknown } | { success: false; error: string }> {
  try {
    if (!jsonString.trim() || !path.trim()) {
      return { success: true, data: null };
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonString);
    } catch (e) {
      return { success: false, error: 'Invalid JSON input' };
    }

    const { JSONPath } = await import('jsonpath-plus');
    const result = JSONPath({ path, json: parsedJson as object });
    return { success: true, data: result };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Invalid JSONPath expression' };
  }
}
