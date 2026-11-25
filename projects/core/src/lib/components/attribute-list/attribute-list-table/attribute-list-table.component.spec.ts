import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { AttributeType } from '@tailormap-viewer/api';
import { AttributeListTableComponent } from './attribute-list-table.component';
import { AttributeListColumnModel } from '../models/attribute-list-column.model';

const columns: AttributeListColumnModel[] = [
  { id: 'name', label: 'Name', type: AttributeType.STRING, visible: true },
];

const setup = async (sort: { column: string; direction: string } | null) => {
  const setSort = vi.fn();
  await render(AttributeListTableComponent, {
    inputs: { columns, rows: [], sort },
    on: { setSort },
  });
  return { setSort };
};

describe('AttributeListTableComponent', () => {

  test('clicking the sort button sorts ascending once', async () => {
    const { setSort } = await setup(null);
    await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
    expect(setSort).toHaveBeenCalledTimes(1);
    expect(setSort).toHaveBeenCalledWith({ columnId: 'name', direction: 'asc' });
  });

  test('clicking the header cell sorts ascending', async () => {
    const { setSort } = await setup(null);
    await userEvent.click(screen.getByText('Name'));
    expect(setSort).toHaveBeenCalledTimes(1);
    expect(setSort).toHaveBeenCalledWith({ columnId: 'name', direction: 'asc' });
  });

  test('toggles from ascending to descending', async () => {
    const asc = await setup({ column: 'name', direction: 'asc' });
    await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
    expect(asc.setSort).toHaveBeenCalledWith({ columnId: 'name', direction: 'desc' });
  });

  test('toggles from descending to none', async () => {
    const desc = await setup({ column: 'name', direction: 'desc' });
    await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
    expect(desc.setSort).toHaveBeenCalledWith({ columnId: 'name', direction: '' });
  });

});
