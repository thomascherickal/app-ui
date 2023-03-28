import {
  call,
  put,
  setLoaderError,
  setLoaderStart,
  setLoaderSuccess,
} from "saga-query";

import { AUTH_LOADER_ID } from "./loader";
import { ElevateToken, ElevateTokenCtx, elevateToken } from "./token";
import { ThunkCtx, thunks } from "@app/api";

export type ElevateCtx = ThunkCtx<ElevateToken>;

export const elevate = thunks.create<ElevateToken>(
  "elevate",
  function* onElevate(ctx: ThunkCtx<ElevateToken>, next) {
    yield put(setLoaderStart({ id: AUTH_LOADER_ID }));
    const tokenCtx: ElevateTokenCtx = yield call(
      elevateToken.run,
      elevateToken(ctx.payload),
    );

    if (!tokenCtx.json.ok) {
      const { message, error, code, exception_context } = tokenCtx.json.data;
      yield put(
        setLoaderError({
          id: AUTH_LOADER_ID,
          message,
          meta: { error, code, exception_context },
        }),
      );
      return;
    }

    yield put(setLoaderSuccess({ id: AUTH_LOADER_ID }));
    yield next();
  },
);
