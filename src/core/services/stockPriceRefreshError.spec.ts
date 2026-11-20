import { describe, expect, it } from 'vitest';
import { stockPriceRefreshErrorMessage } from './stockPriceRefreshError';

describe('stock price refresh errors', () => {
    it('shows provider details from the generated client', () => {
        expect(stockPriceRefreshErrorMessage({ error: { message: 'ABB: No data found, symbol may be delisted' } }))
            .toBe('ABB: No data found, symbol may be delisted');
    });
    it('shows ABP details from Axios', () => {
        expect(stockPriceRefreshErrorMessage({ response: { data: { error: { message: 'Provider request timed out.' } } } }))
            .toBe('Provider request timed out.');
    });
    it('uses a fallback for missing errors', () => {
        expect(stockPriceRefreshErrorMessage(null)).toBe('An error occurred while refreshing stock price data');
    });
});
