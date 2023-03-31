import {
  Box,
  Button,
  FormGroup,
  IconAlertTriangle,
  IconCopy,
  IconExternalLink,
  IconTrash,
  Input,
  Label,
} from "../shared";
import { deprovisionDatabase, selectDatabaseById } from "@app/deploy";
import { AppState } from "@app/types";
import { SyntheticEvent, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";

export const DatabaseSettingsPage = () => {
  const { id = "" } = useParams();
  const [deleteConfirm, setDeleteConfirm] = useState<string>("");
  const [handle, setHandle] = useState<string>("");
  const [isDeprovisioning, setIsDeprovisioning] = useState<boolean>(false);

  const dispatch = useDispatch();
  const database = useSelector((s: AppState) => selectDatabaseById(s, { id }));

  useEffect(() => {
    setHandle(database.handle);
  }, [database.id]);

  const onSubmitForm = (e: SyntheticEvent) => {
    e.preventDefault();
  };

  const requestDeprovisionDatabase = (e: SyntheticEvent) => {
    e.preventDefault();

    setIsDeprovisioning(true);
    dispatch(deprovisionDatabase({ dbId: database.id }));
  };

  const disabledDeprovisioning =
    isDeprovisioning || "delete" !== deleteConfirm.toLocaleLowerCase();

  return (
    <div className="mb-4">
      <Box>
        <Button className="relative float-right" variant="white">
          View Docs
          <IconExternalLink className="inline ml-3 h-5 mt-0" />
        </Button>
        <h1 className="text-lg text-gray-500">Database Settings</h1>
        <br />
        <form onSubmit={onSubmitForm}>
          <FormGroup label={""} htmlFor="input-name">
            <Label className="text-base font-semibold text-gray-900 block">
              Database Name
            </Label>
            <Input
              name="app-handle"
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.currentTarget.value)}
              autoComplete="name"
              data-testid="input-name"
              id="input-name"
            />
          </FormGroup>
          <Label className="text-base mt-4 font-semibold text-gray-900 block">
            Database ID
          </Label>
          <p>
            {database.id} <IconCopy className="inline h-4" color="#888C90" />
          </p>
          <div className="mt-4 flex" />
          <FormGroup label="Thumbnail Image" htmlFor="thumbnail">
            <div className="flex justify-between items-center mb-4">
              <select
                value={"test"}
                className="mb-2 w-full appearance-none block px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="select"
                disabled
              >
                <option value="test" disabled>
                  Some Icon
                </option>
              </select>
            </div>
            <hr />
            <div className="flex mt-4">
              <Button className="w-40 mb-4 flex semibold" onClick={() => {}}>
                Save Changes
              </Button>
              <Button
                className="w-40 ml-4 mb-4 flex"
                onClick={() => {}}
                variant="white"
              >
                <span className="text-base semibold">Cancel</span>
              </Button>
            </div>
          </FormGroup>
        </form>
      </Box>

      <Box>
        <h1 className="text-lg text-red-500 font-semibold">
          <IconAlertTriangle
            className="inline pr-3 mb-1"
            style={{ width: 32 }}
            color="#AD1A1A"
          />
          Deprovision Database
        </h1>
        <div className="mt-2">
          <p>
            This will permanently deprovision <strong>{database.handle}</strong>{" "}
            database. This action cannot be undone. If you want to proceed, type
            Delete below to continue.
          </p>
          <div className="flex mt-4 wd-60">
            <Input
              className="flex"
              disabled={isDeprovisioning}
              name="delete-confirm"
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.currentTarget.value)}
              data-testid="delete-confirm"
              id="delete-confirm"
            />
            <Button
              variant="secondary"
              style={{
                backgroundColor: "#AD1A1A",
                color: "#FFF",
                opacity: disabledDeprovisioning ? 0.5 : 1,
              }}
              disabled={disabledDeprovisioning}
              className="h-15 w-70 mb-0 ml-4 flex"
              onClick={requestDeprovisionDatabase}
            >
              <IconTrash color="#FFF" className="mr-2" />
              {isDeprovisioning ? "Deprovisioning..." : "Deprovision Database"}
            </Button>
          </div>
        </div>
      </Box>
    </div>
  );
};
