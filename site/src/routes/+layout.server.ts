export function load({ locals }: any) {
	return {
		user: locals.user,
		userVatsimData: locals.userVatsimData,
		session: locals.session,
		version: locals.version
	};
}
