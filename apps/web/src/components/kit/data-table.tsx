import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableRowActions } from "@/components/kit/table-row-actions";

export type DataColumn<Row> = {
  id: string;
  header: string;
  cell: (row: Row) => React.ReactNode;
  mobilePriority?: "primary" | "secondary" | "hidden";
};

export function DataTable<Row extends { id: string }>({
  rows,
  columns,
  rowActions = [],
}: {
  rows: readonly Row[];
  columns: readonly DataColumn<Row>[];
  rowActions?: readonly { label: string }[];
}) {
  return (
    <>
      <Card className="hidden overflow-hidden py-0 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => <TableHead key={column.id}>{column.header}</TableHead>)}
              {rowActions.length ? <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {columns.map((column) => <TableCell key={column.id}>{column.cell(row)}</TableCell>)}
                {rowActions.length ? (
                  <TableCell>
                    <TableRowActions labels={rowActions.map((action) => action.label)} />
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <Card key={row.id} className="gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                {columns
                  .filter((column) => column.mobilePriority !== "hidden")
                  .map((column) => (
                    <div key={column.id} className="text-sm">
                      {column.mobilePriority === "primary" ? null : (
                        <span className="mr-2 text-xs text-muted-foreground">{column.header}</span>
                      )}
                      {column.cell(row)}
                    </div>
                  ))}
              </div>
              {rowActions.length ? <TableRowActions labels={rowActions.map((action) => action.label)} /> : null}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
