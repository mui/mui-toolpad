import { NextRequest, NextResponse } from 'next/server';
import { getEmployeesStore, setEmployeesStore } from '../../employeesStore';
import type { Employee } from '../../mocks/employees';
import type { GridFilterModel, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import type { OmitId } from '@toolpad/core/Crud';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page: GridPaginationModel['page'] = Number(searchParams.get('page')) || 0;
  const pageSize: GridPaginationModel['pageSize'] = Number(searchParams.get('pageSize')) || 10;
  const sortModel: GridSortModel = searchParams.get('sort')
    ? JSON.parse(searchParams.get('sort')!)
    : [];
  const filterModel: GridFilterModel = searchParams.get('filter')
    ? JSON.parse(searchParams.get('filter')!)
    : [];

  const employeesStore = getEmployeesStore();

  let filteredEmployees = [...employeesStore];

  // Apply filters (example only)
  if (filterModel?.items?.length) {
    filterModel.items.forEach(({ field, value, operator }) => {
      if (!field || value == null) {
        return;
      }

      filteredEmployees = filteredEmployees.filter((employee) => {
        const employeeValue = employee[field];

        switch (operator) {
          case 'contains':
            return String(employeeValue).toLowerCase().includes(String(value).toLowerCase());
          case 'equals':
            return employeeValue === value;
          case 'startsWith':
            return String(employeeValue).toLowerCase().startsWith(String(value).toLowerCase());
          case 'endsWith':
            return String(employeeValue).toLowerCase().endsWith(String(value).toLowerCase());
          case '>':
            return (employeeValue as number) > value;
          case '<':
            return (employeeValue as number) < value;
          default:
            return true;
        }
      });
    });
  }

  // Apply sorting
  if (sortModel?.length) {
    filteredEmployees.sort((a, b) => {
      for (const { field, sort } of sortModel) {
        if ((a[field] as number) < (b[field] as number)) {
          return sort === 'asc' ? -1 : 1;
        }
        if ((a[field] as number) > (b[field] as number)) {
          return sort === 'asc' ? 1 : -1;
        }
      }
      return 0;
    });
  }

  // Apply pagination
  const start = page * pageSize;
  const end = start + pageSize;
  const paginatedEmployees = filteredEmployees.slice(start, end);

  return NextResponse.json({
    items: paginatedEmployees,
    itemCount: filteredEmployees.length,
  });
}

export async function POST(req: NextRequest) {
  const body: OmitId<Employee> = await req.json();

  const employeesStore = getEmployeesStore();

  const newEmployee = {
    id: employeesStore.reduce((max, employee) => Math.max(max, employee.id), 0) + 1,
    ...body,
  } as Employee;

  setEmployeesStore([...employeesStore, newEmployee]);

  return NextResponse.json(newEmployee, { status: 201 });
}
