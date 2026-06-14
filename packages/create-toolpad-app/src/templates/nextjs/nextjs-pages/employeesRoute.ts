const route = `import { NextApiRequest, NextApiResponse } from 'next';
import { getEmployeesStore, setEmployeesStore } from '../../../employeesStore';
import type { Employee } from '../../../data/employees';
import type { GridFilterModel, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import type { OmitId } from '@toolpad/core/Crud';

export async function getEmployees(req: NextApiRequest, res: NextApiResponse) {
  const page: GridPaginationModel['page'] = parseInt(req.query.page as string, 10);
  const pageSize: GridPaginationModel['pageSize'] = parseInt(req.query.pageSize as string, 10);
  const sortModel: GridSortModel = req.query.sort ? JSON.parse(req.query.sort as string) : [];
  const filterModel: GridFilterModel = req.query.filter
    ? JSON.parse(req.query.filter as string)
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

  return res.status(200).json({
    items: paginatedEmployees,
    itemCount: filteredEmployees.length,
  });
}

export async function createEmployee(req: NextApiRequest, res: NextApiResponse) {
  const body: OmitId<Employee> = req.body;

  const employeesStore = getEmployeesStore();

  const newEmployee = {
    id: employeesStore.reduce((max, employee) => Math.max(max, employee.id), 0) + 1,
    ...body,
  } as Employee;

  setEmployeesStore([...employeesStore, newEmployee]);

  return res.status(201).json(newEmployee);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getEmployees(req, res);
  }

  if (req.method === 'POST') {
    return createEmployee(req, res);
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
`;

export default route;
