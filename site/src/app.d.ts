// See https://svelte.dev/docs/kit/types#app.d.ts

import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { Session, User } from '$lib/server/session';

// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env;
			cf: CfProperties;
			ctx: ExecutionContext;
		}
		interface Locals {
			db: DrizzleD1Database;
			user?: User;
			session?: Session;
			userVatsimData?: VatsimUserData;
		}
	}
}

export {};
