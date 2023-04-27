import {
  AptibleLogo,
  Box,
  ButtonLink,
  IconArrowRight,
  tokens,
} from "../shared";
import { createProjectGitUrl } from "@app/routes";

export const CreateProjectPage = () => {
  return (
    <div
      className="flex flex-col flex-1 h-full bg-no-repeat bg-center bg-cover"
      style={{
        backgroundImage: "url(/background-pattern-v2.png)",
      }}
    >
      <main className="flex-1">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="py-4">
              <div className="flex justify-center container">
                <div style={{ width: 500 }}>
                  <div className="flex items-center justify-center mb-5">
                    <AptibleLogo />
                  </div>
                  <div className="text-center">
                    <h1 className={tokens.type.h1}>Create an Environment</h1>
                    <p className="my-4 text-gray-600">
                      Choose a deployment type for your app to get started.
                    </p>
                  </div>
                  <Box>
                    <ButtonLink
                      to={createProjectGitUrl()}
                      className="font-semibold"
                    >
                      Deploy your code
                      <IconArrowRight className="ml-2" />
                    </ButtonLink>
                  </Box>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
