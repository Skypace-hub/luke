"use client";
"use no memo";

import { Button } from "@luke/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@luke/ui/components/dropdown-menu";
import { Input } from "@luke/ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow as UiTableRow,
} from "@luke/ui/components/table";
import { cn } from "@luke/ui/lib/utils";
import {
	type ColumnDef,
	type ColumnFiltersState,
	type FilterFn,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type PaginationState,
	type RowSelectionState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	CircleXIcon,
	DownloadIcon,
	SearchIcon,
	SlidersHorizontalIcon,
} from "lucide-react";
import {
	type ComponentPropsWithoutRef,
	isValidElement,
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";

export interface DataTableRow {
	actions?: ReactNode;
	cells: ReactNode[];
	id: string;
	searchText?: string;
}

interface ServiceTableRow {
	actions?: ReactNode;
	cells: ReactNode[];
	id: string;
	search: string;
	values: string[];
}

interface ServiceTableFilterConfig {
	columnId: string;
	label: string;
	options: string[];
}

interface DataTableProps {
	columns: string[];
	description?: string;
	filterLabels?: string[];
	rows: DataTableRow[];
	title?: string;
}

const compactButtonClass = "rounded-lg";
const panelClass =
	"rounded-xl bg-card text-card-foreground shadow-none ring-1 ring-foreground/10";

const nonFileNameCharactersPattern = /[^a-z0-9]+/gi;
const edgeDashPattern = /^-|-$/g;
const csvEscapingPattern = /[",\n\r]/;
const filterLabelSeparatorPattern = /[^a-z0-9]+/g;

export function DataTable({
	columns,
	description,
	filterLabels = ["Status", "Date"],
	rows,
	title,
}: DataTableProps) {
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
	const [exportFeedback, setExportFeedback] = useState("");
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});
	const tableIdentity = useMemo(
		() => [title ?? "", ...columns, ...filterLabels].join("::"),
		[columns, filterLabels, title]
	);
	const hasRowActions = rows.some((row) => row.actions !== undefined);
	const tableRows = useMemo(() => toServiceTableRows(rows), [rows]);
	const filterConfigs = useMemo(
		() =>
			getServiceTableFilterConfigs({ columns, filterLabels, rows: tableRows }),
		[columns, filterLabels, tableRows]
	);
	const tableColumns = useMemo(
		() => getServiceTableColumns(columns, hasRowActions),
		[columns, hasRowActions]
	);
	const table = useReactTable({
		columns: tableColumns,
		data: tableRows,
		enableRowSelection: true,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getRowId: (row) => row.id,
		getSortedRowModel: getSortedRowModel(),
		globalFilterFn: serviceTableGlobalFilter,
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: setPagination,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		state: {
			columnFilters,
			globalFilter,
			pagination,
			rowSelection,
			sorting,
		},
	});

	useEffect(() => {
		const shouldResetTableState = tableIdentity.length > 0;

		if (!shouldResetTableState) {
			return;
		}

		setColumnFilters([]);
		setExportFeedback("");
		setGlobalFilter("");
		setPagination({ pageIndex: 0, pageSize: 10 });
		setRowSelection({});
		setSorting([]);
	}, [tableIdentity]);

	const filteredRowCount = table.getFilteredRowModel().rows.length;
	const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;
	const currentPage = table.getState().pagination.pageIndex + 1;
	const rowsPerPage = table.getState().pagination.pageSize;
	const pageCount = Math.max(table.getPageCount(), 1);
	const hasRows = tableRows.length > 0;
	const hasFilteredRows = filteredRowCount > 0;
	const primarySort = sorting.find((sort) => sort.id === "column-0");
	const sortValue = getSortMenuValue(primarySort);
	const normalizedSearchQuery = globalFilter.trim();

	const exportVisibleRows = () => {
		const visibleRows = table
			.getFilteredRowModel()
			.rows.map((row) => row.original);
		exportRowsToCsv({
			columns,
			rows: visibleRows,
			title: title ?? "service-records",
		});
		setExportFeedback(`${visibleRows.length} row(s) exported.`);
	};

	return (
		<div className={`${panelClass} overflow-hidden`}>
			<div className="flex flex-col gap-4 p-4">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
					<div>
						<p className="font-medium text-base leading-none">
							{title ?? `${rows.length} Records`}
						</p>
						<p className="mt-1 text-muted-foreground text-sm">
							{description ??
								"Recent service records with status, ownership, and schedule activity."}
						</p>
					</div>
					<Button
						className={compactButtonClass}
						disabled={!hasFilteredRows}
						onClick={exportVisibleRows}
						size="sm"
						variant="outline"
					>
						<DownloadIcon data-icon="inline-start" />
						Export
					</Button>
				</div>
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<div className="relative sm:w-[340px]">
							<SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								aria-label="Search records"
								className="h-8 rounded-lg bg-background pr-8 pl-9"
								onChange={(event) => {
									table.setGlobalFilter(event.target.value);
									table.setPageIndex(0);
								}}
								placeholder="Search records..."
								value={globalFilter}
							/>
							{globalFilter ? (
								<button
									aria-label="Clear search"
									className="absolute top-1/2 right-2 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
									onClick={() => {
										table.setGlobalFilter("");
										table.setPageIndex(0);
									}}
									type="button"
								>
									<CircleXIcon className="size-4" />
								</button>
							) : null}
						</div>
						{filterConfigs.map((filter) => (
							<FilterMenu
								config={filter}
								key={filter.columnId}
								onChange={(value) => {
									table
										.getColumn(filter.columnId)
										?.setFilterValue(value === "all" ? undefined : value);
									table.setPageIndex(0);
								}}
								value={
									(table.getColumn(filter.columnId)?.getFilterValue() as
										| string
										| undefined) ?? "all"
								}
							/>
						))}
					</div>
					<div className="flex flex-wrap gap-2">
						<SortMenu
							onChange={(value) => {
								if (value === "default") {
									table.setSorting([]);
								} else {
									table.setSorting([
										{ desc: value === "desc", id: "column-0" },
									]);
								}
								table.setPageIndex(0);
							}}
							value={sortValue}
						/>
					</div>
				</div>
			</div>
			<div className="overflow-x-auto overflow-y-hidden border-t">
				<Table className="min-w-[820px] **:data-[slot=table-cell]:px-4 **:data-[slot=table-head]:px-4 **:data-[slot=table-cell]:py-4">
					<TableHeader className="**:data-[slot=table-head]:h-11 **:data-[slot=table-head]:font-medium **:data-[slot=table-head]:text-foreground **:data-[slot=table-head]:text-sm">
						{table.getHeaderGroups().map((headerGroup) => (
							<UiTableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										className={cn(
											"h-11 px-4 font-medium",
											header.column.id === "actions" ? "text-right" : ""
										)}
										colSpan={header.colSpan}
										key={header.id}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
									</TableHead>
								))}
							</UiTableRow>
						))}
					</TableHeader>
					<TableBody className="**:data-[slot=table-row]:border-border/50 **:data-[slot=table-row]:hover:bg-transparent">
						{table.getRowModel().rows.length ? (
							table.getRowModel().rows.map((row) => (
								<UiTableRow
									data-state={row.getIsSelected() ? "selected" : undefined}
									key={row.id}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											className={cn(
												"px-4 py-4",
												cell.column.id === "actions" ? "text-right" : ""
											)}
											key={cell.id}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</UiTableRow>
							))
						) : (
							<UiTableRow>
								<TableCell
									className="h-24 text-center text-muted-foreground"
									colSpan={table.getVisibleLeafColumns().length}
								>
									{hasRows ? "No matching records." : "No records yet."}
								</TableCell>
							</UiTableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex flex-col gap-3 px-4 py-4 text-muted-foreground text-sm lg:flex-row lg:items-center lg:justify-between">
				<div className="flex flex-col gap-1">
					<p>
						{selectedRowCount} of {filteredRowCount} row(s) selected.
					</p>
					{exportFeedback ? <p>{exportFeedback}</p> : null}
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<label className="flex items-center gap-2">
						<span>Rows per page</span>
						<select
							aria-label="Rows per page"
							className="h-8 rounded-lg border bg-background px-2 text-foreground text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
							name="rows-per-page"
							onChange={(event) => {
								table.setPageSize(Number(event.target.value));
							}}
							value={rowsPerPage}
						>
							{[10, 20, 30, 40, 50].map((pageSize) => (
								<option key={pageSize} value={pageSize}>
									{pageSize}
								</option>
							))}
						</select>
					</label>
					<p>
						Showing {table.getRowModel().rows.length} of {filteredRowCount}
						{normalizedSearchQuery ? " filtered" : ""} records.
					</p>
					<p>
						Page {currentPage} of {pageCount}
					</p>
					<div className="flex items-center gap-2">
						<Button
							aria-label="Go to previous page"
							className={compactButtonClass}
							disabled={!table.getCanPreviousPage()}
							onClick={() => table.previousPage()}
							size="icon-sm"
							variant="outline"
						>
							<ChevronLeftIcon className="size-4" />
						</Button>
						<Button
							aria-label="Go to next page"
							className={compactButtonClass}
							disabled={!table.getCanNextPage()}
							onClick={() => table.nextPage()}
							size="icon-sm"
							variant="outline"
						>
							<ChevronRightIcon className="size-4" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

function FilterMenu({
	config,
	onChange,
	value,
}: {
	config: ServiceTableFilterConfig;
	onChange: (value: string) => void;
	value: string;
}) {
	const activeOption =
		config.options.find((option) => option === value) ?? "All";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						className={cn(
							"h-8 rounded-lg bg-background text-sm",
							value === "all" ? "" : "border-primary text-foreground"
						)}
						size="sm"
						variant="outline"
					/>
				}
			>
				{config.label}
				{value === "all" ? null : (
					<span className="ml-1 text-muted-foreground">· {activeOption}</span>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-44 bg-card">
				<DropdownMenuRadioGroup onValueChange={onChange} value={value}>
					<DropdownMenuRadioItem closeOnClick value="all">
						All
					</DropdownMenuRadioItem>
					{config.options.map((option) => (
						<DropdownMenuRadioItem closeOnClick key={option} value={option}>
							{option}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function getSortMenuValue(sort: SortingState[number] | undefined) {
	if (!sort) {
		return "default";
	}

	if (sort.desc) {
		return "desc";
	}

	return "asc";
}

function getSortMenuLabel(value: string) {
	if (value === "asc") {
		return "A-Z";
	}

	if (value === "desc") {
		return "Z-A";
	}

	return "Default";
}

function SortMenu({
	onChange,
	value,
}: {
	onChange: (value: string) => void;
	value: string;
}) {
	const sortLabel = getSortMenuLabel(value);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						className={cn(
							"h-8 rounded-lg bg-background text-sm",
							value === "default" ? "" : "border-primary text-foreground"
						)}
						size="sm"
						variant="outline"
					/>
				}
			>
				<SlidersHorizontalIcon data-icon="inline-start" />
				Sort
				<span className="ml-1 text-muted-foreground">· {sortLabel}</span>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-40 bg-card">
				<DropdownMenuRadioGroup onValueChange={onChange} value={value}>
					<DropdownMenuRadioItem closeOnClick value="default">
						Default
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem closeOnClick value="asc">
						A-Z
					</DropdownMenuRadioItem>
					<DropdownMenuRadioItem closeOnClick value="desc">
						Z-A
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function TableSelectionCheckbox({
	indeterminate = false,
	...props
}: ComponentPropsWithoutRef<"input"> & { indeterminate?: boolean }) {
	const checkboxRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (checkboxRef.current) {
			checkboxRef.current.indeterminate = indeterminate;
		}
	}, [indeterminate]);

	return (
		<input
			className="size-4 rounded border bg-background accent-primary disabled:cursor-not-allowed disabled:opacity-40"
			ref={checkboxRef}
			type="checkbox"
			{...props}
		/>
	);
}

function getNodeText(node: ReactNode): string {
	if (node === null || node === undefined || typeof node === "boolean") {
		return "";
	}

	if (typeof node === "string" || typeof node === "number") {
		return String(node);
	}

	if (Array.isArray(node)) {
		return node.map(getNodeText).join(" ");
	}

	if (isValidElement(node)) {
		const props = node.props as { children?: ReactNode };

		return getNodeText(props.children);
	}

	return "";
}

function getRowSearchText(row: DataTableRow) {
	return [row.id, row.searchText ?? "", ...row.cells.map(getNodeText)]
		.join(" ")
		.toLowerCase();
}

function toServiceTableRows(rows: DataTableRow[]): ServiceTableRow[] {
	return rows.map((row) => ({
		actions: row.actions,
		cells: row.cells,
		id: row.id,
		search: getRowSearchText(row),
		values: row.cells.map(getNodeText),
	}));
}

function serviceTableGlobalFilter(
	row: { original: ServiceTableRow },
	_columnId: string,
	filterValue: unknown
) {
	const query = String(filterValue ?? "")
		.trim()
		.toLowerCase();

	if (!query) {
		return true;
	}

	return row.original.search.includes(query);
}

const serviceTableColumnFilter: FilterFn<ServiceTableRow> = (
	row,
	columnId,
	filterValue
) => {
	const selectedValue = String(filterValue ?? "");

	if (!selectedValue || selectedValue === "all") {
		return true;
	}

	const cellValue = String(row.getValue(columnId) ?? "");

	return cellValue === selectedValue;
};

function getServiceTableFilterConfigs({
	columns,
	filterLabels,
	rows,
}: {
	columns: string[];
	filterLabels: string[];
	rows: ServiceTableRow[];
}): ServiceTableFilterConfig[] {
	return filterLabels
		.map((label) => {
			const columnIndex = getFilterColumnIndex({ columns, label });

			if (columnIndex === -1) {
				return null;
			}

			const options = Array.from(
				new Set(
					rows
						.map((row) => row.values[columnIndex]?.trim() ?? "")
						.filter(Boolean)
				)
			).sort((first, second) =>
				first.localeCompare(second, undefined, { sensitivity: "base" })
			);

			if (options.length === 0) {
				return null;
			}

			return {
				columnId: `column-${columnIndex}`,
				label,
				options,
			};
		})
		.filter((config): config is ServiceTableFilterConfig => config !== null);
}

function getFilterColumnIndex({
	columns,
	label,
}: {
	columns: string[];
	label: string;
}) {
	const normalizedLabel = normalizeFilterLabel(label);
	const exactMatchIndex = columns.findIndex(
		(column) => normalizeFilterLabel(column) === normalizedLabel
	);

	if (exactMatchIndex !== -1) {
		return exactMatchIndex;
	}

	const includedMatchIndex = columns.findIndex((column) => {
		const normalizedColumn = normalizeFilterLabel(column);

		return (
			normalizedColumn.includes(normalizedLabel) ||
			normalizedLabel.includes(normalizedColumn)
		);
	});

	if (includedMatchIndex !== -1) {
		return includedMatchIndex;
	}

	const labelTokens = getFilterTokens(label);

	return columns.findIndex((column) =>
		getFilterTokens(column).some((token) => labelTokens.includes(token))
	);
}

function normalizeFilterLabel(value: string) {
	return value.toLowerCase().replaceAll(filterLabelSeparatorPattern, "");
}

function getFilterTokens(value: string) {
	return value
		.toLowerCase()
		.split(filterLabelSeparatorPattern)
		.filter((token) => token.length > 2);
}

function getServiceTableColumns(
	columns: string[],
	hasActions: boolean
): ColumnDef<ServiceTableRow>[] {
	const tableColumns: ColumnDef<ServiceTableRow>[] = [
		{
			cell: ({ row }) => (
				<TableSelectionCheckbox
					aria-label={`Select ${row.original.id}`}
					checked={row.getIsSelected()}
					disabled={!row.getCanSelect()}
					onChange={row.getToggleSelectedHandler()}
				/>
			),
			enableSorting: false,
			header: ({ table }) => (
				<TableSelectionCheckbox
					aria-label="Select all visible rows"
					checked={table.getIsAllPageRowsSelected()}
					disabled={table.getRowModel().rows.length === 0}
					indeterminate={
						table.getIsSomePageRowsSelected() &&
						!table.getIsAllPageRowsSelected()
					}
					onChange={table.getToggleAllPageRowsSelectedHandler()}
				/>
			),
			id: "select",
			size: 48,
		},
		...columns.map<ColumnDef<ServiceTableRow>>((column, index) => ({
			accessorFn: (row) => row.values[index] ?? "",
			cell: ({ row }) =>
				row.original.cells[index] ?? row.original.values[index] ?? "",
			filterFn: serviceTableColumnFilter,
			header: column,
			id: `column-${index}`,
		})),
	];

	if (hasActions) {
		tableColumns.push({
			cell: ({ row }) => row.original.actions,
			enableSorting: false,
			header: "Actions",
			id: "actions",
		});
	}

	return tableColumns;
}

function exportRowsToCsv({
	columns,
	rows,
	title,
}: {
	columns: string[];
	rows: ServiceTableRow[];
	title: string;
}) {
	const header = [...columns, "Row ID"];
	const csvRows = [
		header.map(escapeCsvValue).join(","),
		...rows.map((row) => [...row.values, row.id].map(escapeCsvValue).join(",")),
	];
	const csvBlob = new Blob([csvRows.join("\n")], {
		type: "text/csv;charset=utf-8",
	});
	const url = URL.createObjectURL(csvBlob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `${toFileName(title)}.csv`;
	document.body.append(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
	toast.success(`${rows.length} row(s) exported.`);
}

function escapeCsvValue(value: string) {
	const normalizedValue = value.replaceAll('"', '""');

	if (csvEscapingPattern.test(normalizedValue)) {
		return `"${normalizedValue}"`;
	}

	return normalizedValue;
}

export function toFileName(value: string) {
	return (
		value
			.toLowerCase()
			.replace(nonFileNameCharactersPattern, "-")
			.replace(edgeDashPattern, "") || "service-records"
	);
}
