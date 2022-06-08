import { ChevronDownIcon } from '@heroicons/react/outline';
import { ListboxOption } from '@reach/listbox';
import {
  ListboxInput,
  ListboxButton,
  ListboxPopover,
  ListboxList,
} from './listbox';

import type { DeployEnvironment } from '@app/types';

export const SelectEnvironmentMenu = ({
  environments,
}: {
  environments: DeployEnvironment[];
}) => {
  const setSelection = () => {};
  return (
    <ListboxInput onChange={setSelection}>
      <ListboxButton size="xl" arrow={<ChevronDownIcon className="h-3 w-3" />}>
        Filter by Environment
      </ListboxButton>
      <ListboxPopover>
        <ListboxList>
          {environments.map((environment) => (
            <ListboxOption key={environment.id} value={environment.id}>
              {environment.handle}
            </ListboxOption>
          ))}
        </ListboxList>
      </ListboxPopover>
    </ListboxInput>
  );
};
