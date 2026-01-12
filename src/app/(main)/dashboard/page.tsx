import { ChartAreaInteractive } from "./_components/default-dashboard/chart-area-interactive";
import data from "./_components/default-dashboard/data.json";
import { DataTable } from "./_components/default-dashboard/data-table";
import { SectionCards } from "./_components/default-dashboard/section-cards";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <SectionCards />
      <ChartAreaInteractive />
      <DataTable data={data} />
    </div>
  );
}
