import { UserMenu } from "./user-menu";
import { AptibleLogo } from "./aptible-logo";

import { CircleStack, Cogs8Tooth, Cube } from "@app/ui/shared/icons";
import { appsUrl, createProjectUrl, databasesUrl, teamUrl } from "@app/routes";
import { ButtonCreate } from "./button";
import { LinkNav } from "./link";
import { useNavigate } from "react-router";

export const ApplicationSidebar = () => {
  const navigate = useNavigate();
  // Moved navigation inside function to allow dynamic changes of color if needed
  const navigation = [
    { name: "Apps", to: appsUrl(), icon: <Cube /> },
    { name: "Data Stores", to: databasesUrl(), icon: <CircleStack /> },
    { name: "Company Settings", to: teamUrl(), icon: <Cogs8Tooth /> },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <AptibleLogo />
        </div>
        <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
          {navigation.map((item) => (
            <LinkNav {...item} />
          ))}
        </nav>
      </div>
      <div className="px-3 w-full">
        <ButtonCreate
          className="w-full mb-4"
          onClick={() => navigate(createProjectUrl())}
        >
          Create
        </ButtonCreate>
        <UserMenu />
        <div className="my-6 flex justify-between text-xs text-gray-500">
          <a href="https://aptible.com/docs">DOCS</a>
          <a href="https://aptible.com/support">SUPPORT</a>
          <a href="https://aptible.com/cli">INSTALL CLI</a>
        </div>
      </div>
    </div>
  );
};
