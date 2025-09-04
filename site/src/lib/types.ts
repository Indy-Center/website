export type VatsimMetarResponse = {
	id: string;
	metar: string;
}[];

export type VatsimEvent = {
	id: number;
	type: string;
	name: string;
	link: string;
	organisers: {
		region: string;
		division: string;
		subdivision: string | null;
		organised_by_vatsim: boolean;
	}[];
	airports: {
		icao: string;
	}[];
	routes: string[];
	start_time: string;
	end_time: string;
	short_description: string;
	description: string;
	banner: string;
};

export type VnasController = {
	artccId: string;
	primaryFacilityId: string;
	primaryPositionId: string;
	role: string;
	positions: VnasPosition[];
	isActive: boolean;
	isObserver: boolean;
	loginTime: string;
	vatsimData: VnasVatsimData;
};

export type VnasVatsimData = {
	cid: string;
	realName: string;
	controllerInfo: string;
	userRating: string;
	loginTime: string;
};

export type VnasPosition = {
	facilityId: string;
	facilityName: string;
	positionId: string;
	positionName: string;
	positionType: string;
	radioName: string;
	defaultCallsign: string;
	frequency: number;
	isPrimary: boolean;
	isActive: boolean;
};

export type VnasControllerResponse = {
	controllers: VnasController[];
};

/**
 * "data": [
		{
			"cid": 1757138,
			"fname": "Matthew",
			"lname": "Adams",
			"email": null,
			"facility": "ZID",
			"rating": 2,
			"created_at": "2023-10-10T00:54:41+00:00",
			"updated_at": "2025-08-31T21:05:35+00:00",
			"flag_needbasic": false,
			"flag_xferOverride": false,
			"facility_join": "2024-07-13T15:32:18+00:00",
			"flag_homecontroller": true,
			"lastactivity": "2025-08-28T23:23:56+00:00",
			"flag_broadcastOptedIn": null,
			"flag_preventStaffAssign": null,
			"discord_id": 918277062886830161,
			"last_cert_sync": "2025-08-31 21:05:35",
			"flag_nameprivacy": false,
			"last_competency_date": null,
			"promotion_eligible": true,
			"transfer_eligible": null,
			"roles": [],
			"rating_short": "S1",
			"isMentor": false,
			"isSupIns": false,
			"last_promotion": "2024-10-02T03:24:18+00:00",
			"membership": "home"
		},
 */
//

export type VatusaRosterResponse = {
	data: VatusaRosterMember[];
};

export type VatusaRole = {
	id: number;
	cid: number;
	facility: string;
	role: string;
	created_at: string;
};

export type VatusaRosterMember = {
	cid: number;
	fname: string;
	lname: string;
	email: string | null;
	facility: string;
	rating: number;
	created_at: string;
	updated_at: string;
	flag_needbasic: boolean;
	flag_xferOverride: boolean;
	facility_join: string;
	flag_homecontroller: boolean;
	lastactivity: string;
	flag_broadcastOptedIn: string | null;
	flag_preventStaffAssign: string | null;
	discord_id: number;
	last_cert_sync: string;
	flag_nameprivacy: boolean;
	last_competency_date: string | null;
	promotion_eligible: boolean;
	transfer_eligible: string | null;
	roles: VatusaRole[];
	rating_short: string;
	isMentor: boolean;
	isSupIns: boolean;
	last_promotion: string | null;
	membership: string;
};
