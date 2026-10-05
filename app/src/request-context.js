import { AsyncLocalStorage } from 'node:async_hooks';

// The request currently being handled, available anywhere below the route
// handler without passing it through every function (Topic 10). Used to
// forward the request id to other services, so logs can be joined.
export const requestContext = new AsyncLocalStorage();
export const currentRequestId = () => requestContext.getStore()?.requestId;
