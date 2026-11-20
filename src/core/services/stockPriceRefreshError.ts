export function stockPriceRefreshErrorMessage(error: any): string {
    // NSwag throws the ABP response object directly; Axios nests it in response.data.
    const message = error?.error?.message ?? error?.response?.data?.error?.message;
    return typeof message === 'string' && message.trim()
        ? message
        : 'An error occurred while refreshing stock price data';
}
