import ServiceOpsPage from "../../service-ops-page";

export default async function HospitalDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	return <ServiceOpsPage initialHospitalId={id} />;
}
