import { prettyDateTime } from "@app/date";
import {
  DEFAULT_INSTANCE_CLASS,
  ServiceSizingPolicyEditProps,
  cancelServicesOpsPoll,
  containerSizesByProfile,
  fetchApp,
  fetchService,
  fetchServiceSizingPoliciesByServiceId,
  getContainerProfileFromType,
  hourlyAndMonthlyCostsForContainers,
  modifyServiceSizingPolicy,
  pollServiceOperations,
  scaleService,
  selectAppById,
  selectContainerProfilesForStack,
  selectEnvironmentById,
  selectPreviousServiceScale,
  selectServiceById,
  selectServiceScale,
  selectServiceSizingPolicyByServiceId,
  selectStackById,
} from "@app/deploy";
import {
  useDispatch,
  useLoader,
  useLoaderSuccess,
  useQuery,
  useSelector,
} from "@app/react";
import { appActivityUrl } from "@app/routes";
import { schema } from "@app/schema";
import { DeployOperation, InstanceClass } from "@app/types";
import { SyntheticEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { usePoller, useValidator } from "../hooks";
import {
  Banner,
  ButtonIcon,
  ButtonLinkDocs,
  IconChevronDown,
  IconChevronRight,
  IconRefresh,
  Radio,
  RadioGroup,
} from "../shared";
import {
  BannerMessages,
  Box,
  Button,
  FormGroup,
  Input,
  Label,
  Select,
  SelectOption,
} from "../shared";

const validators = {
  containerCount: (data: AppScaleProps) => {
    if (data.containerCount > 32) {
      return "Container count cannot exceed 32";
    }
  },
};

const policyValidators = {
  ratios: (data: ServiceSizingPolicyEditProps) => {
    if (data.memCpuRatioRThreshold < data.memCpuRatioCThreshold) {
      return "Ratio for R must be larger than ratio for C";
    }
  },
};

type AppScaleProps = {
  containerCount: number;
};

const VerticalAutoscalingSection = ({
  serviceId,
  stackId,
}: { serviceId: string; stackId: string }) => {
  const dispatch = useDispatch();
  useQuery(fetchServiceSizingPoliciesByServiceId({ serviceId }));
  const existingPolicy = useSelector((s) =>
    selectServiceSizingPolicyByServiceId(s, { id: serviceId }),
  );
  const [nextPolicy, setNextPolicy] = useState(existingPolicy);
  useEffect(() => {
    setNextPolicy(existingPolicy);
  }, [existingPolicy.id]);
  const getChangesExist = () => {
    if (!nextPolicy.scalingEnabled && !existingPolicy.scalingEnabled) {
      return false;
    }
    return existingPolicy !== nextPolicy;
  };
  const changesExist = getChangesExist();

  const modifyLoader = useLoader(modifyServiceSizingPolicy);
  const stack = useSelector((s) => selectStackById(s, { id: stackId }));

  const [errors, validate] = useValidator<
    ServiceSizingPolicyEditProps,
    typeof policyValidators
  >(policyValidators);
  const onSubmitForm = (e: SyntheticEvent) => {
    e.preventDefault();
    if (!validate(nextPolicy)) return;
    dispatch(modifyServiceSizingPolicy({ ...nextPolicy, serviceId }));
  };
  const updatePolicy = <K extends keyof ServiceSizingPolicyEditProps>(
    key: K,
    value: ServiceSizingPolicyEditProps[K],
  ) => {
    setNextPolicy({ ...nextPolicy, [key]: value });
  };
  const resetAdvancedSettings = () => {
    setNextPolicy({
      ...schema.serviceSizingPolicies.empty,
      id: nextPolicy.id,
      scalingEnabled: nextPolicy.scalingEnabled,
    });
  };

  const [advancedIsOpen, setOpen] = useState(false);

  if (!stack.verticalAutoscaling) {
    return null;
  }

  return (
    <Box>
      <form onSubmit={onSubmitForm}>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <h1 className="text-lg text-gray-500">Autoscale</h1>
            <ButtonLinkDocs href="https://aptible.notion.site/Vertical-Autoscaler-d33817b4e1584e2e8a8a86edc507756a" />
          </div>
          <BannerMessages {...modifyLoader} />
          <FormGroup
            splitWidthInputs
            description="Automatically scale your services by regularly reviewing recent CPU and RAM utilization and scaling to the optimal configuration."
            label="Vertical Autoscaling"
            htmlFor="vertical-autoscaling"
          >
            <RadioGroup
              name="vertical-autoscaling"
              selected={nextPolicy.scalingEnabled ? "enabled" : "disabled"}
              onSelect={(e) => {
                updatePolicy("scalingEnabled", e === "enabled");
                if (e === "disabled") {
                  setOpen(false);
                }
              }}
            >
              <Radio value="enabled">Enabled</Radio>
              <Radio value="disabled">Disabled</Radio>
            </RadioGroup>
          </FormGroup>
          <div>
            <div className="pb-4 flex justify-between items-center">
              <div className="flex flex-1">
                <div
                  className="font-semibold flex items-center cursor-pointer"
                  onClick={() => setOpen(!advancedIsOpen)}
                  onKeyUp={() => setOpen(!advancedIsOpen)}
                >
                  {advancedIsOpen ? <IconChevronDown /> : <IconChevronRight />}
                  <p>{advancedIsOpen ? "Hide" : "Show"} Advanced Settings</p>
                </div>
              </div>
            </div>
            {advancedIsOpen ? (
              <div className="pb-4">
                <div className="flex flex-col gap-2">
                  <h2 className="text-md text-gray-500">
                    RAM & CPU Threshold Settings
                  </h2>
                  <FormGroup
                    splitWidthInputs
                    description="Percentile to use for RAM and CPU"
                    label="Percentile"
                    htmlFor="percentile"
                  >
                    <Input
                      id="percentile"
                      name="percentile"
                      type="number"
                      step="0.1"
                      value={nextPolicy.percentile}
                      min="0"
                      max="100"
                      placeholder="0 (Min), 100 (Max)"
                      onChange={(e) =>
                        updatePolicy(
                          "percentile",
                          Number(parseFloat(e.currentTarget.value).toFixed(1)),
                        )
                      }
                    />
                  </FormGroup>
                  <FormGroup
                    splitWidthInputs
                    description="The minimum memory that vertical autoscaling can scale this service to"
                    label="Minimum Memory (MB)"
                    htmlFor="minimum-memory"
                  >
                    <Input
                      id="minimum-memory"
                      name="minimum-memory"
                      type="number"
                      value={nextPolicy.minimumMemory}
                      min="512"
                      max="784384"
                      placeholder="512 (Min), 784384 (Max)"
                      onChange={(e) =>
                        updatePolicy(
                          "minimumMemory",
                          parseInt(e.currentTarget.value, 10),
                        )
                      }
                    />
                  </FormGroup>
                  <FormGroup
                    splitWidthInputs
                    description="The maximum memory that vertical autoscaling can scale this service to"
                    label="Maximum Memory (MB)"
                    htmlFor="maximum-memory"
                  >
                    <Input
                      id="maximum-memory"
                      name="maximum-memory"
                      type="number"
                      value={nextPolicy.maximumMemory || ""}
                      min="512"
                      max="784384"
                      placeholder="512 (Min), 784384 (Max)"
                      onChange={(e) =>
                        updatePolicy(
                          "maximumMemory",
                          parseInt(e.currentTarget.value, 10),
                        )
                      }
                    />
                  </FormGroup>
                  <FormGroup
                    splitWidthInputs
                    description="Percent of the current memory limit for a container that will trigger a scale up"
                    label="Memory Scale Up Percentage"
                    htmlFor="memory-scale-up"
                  >
                    <Input
                      id="memory-scale-up"
                      name="memory-scale-up"
                      type="number"
                      step="0.01"
                      value={nextPolicy.memScaleUpThreshold}
                      min="0"
                      max="1"
                      placeholder="0 (Min), 1 (Max)"
                      onChange={(e) =>
                        updatePolicy(
                          "memScaleUpThreshold",
                          Number(parseFloat(e.currentTarget.value).toFixed(2)),
                        )
                      }
                    />
                  </FormGroup>
                  <FormGroup
                    splitWidthInputs
                    description="Percent of the next smallest memory limit for a container that will trigger a scale down"
                    label="Memory Scale Down Percentage"
                    htmlFor="memory-scale-down"
                  >
                    <Input
                      id="memory-scale-down"
                      name="memory-scale-down"
                      type="number"
                      step="0.01"
                      value={nextPolicy.memScaleDownThreshold}
                      min="0"
                      max="1"
                      placeholder="0 (Min), 1 (Max)"
                      onChange={(e) =>
                        updatePolicy(
                          "memScaleDownThreshold",
                          Number(parseFloat(e.currentTarget.value).toFixed(2)),
                        )
                      }
                    />
                  </FormGroup>
                  <FormGroup
                    splitWidthInputs
                    feedbackMessage={errors.ratios}
                    feedbackVariant={errors.ratios ? "danger" : "info"}
                    description="Threshold of the Memory (in GB) to CPU (in CPUs) ratio in which values above will move into R profile"
                    label="Memory Optimized Memory/CPU Ratio Threshold"
                    htmlFor="r-ratio"
                  >
                    <Input
                      id="r-ratio"
                      name="r-ratio"
                      type="number"
                      step="0.1"
                      value={nextPolicy.memCpuRatioRThreshold}
                      min="0"
                      max="16"
                      placeholder="0 (Min), 16 (Max)"
                      onChange={(e) =>
                        updatePolicy(
                          "memCpuRatioRThreshold",
                          Number(parseFloat(e.currentTarget.value).toFixed(1)),
                        )
                      }
                    />
                  </FormGroup>
                  <FormGroup
                    splitWidthInputs
                    description="Threshold of the Memory (in GB) to CPU (in CPUs) ratio in which values below will move into C profile"
                    label="Compute Optimized Memory/CPU Ratio Threshold"
                    htmlFor="c-ratio"
                  >
                    <Input
                      id="c-ratio"
                      name="c-ratio"
                      type="number"
                      step="0.01"
                      value={nextPolicy.memCpuRatioCThreshold}
                      min="0"
                      max="8"
                      placeholder="0 (Min), 8 (Max)"
                      onChange={(e) =>
                        updatePolicy(
                          "memCpuRatioCThreshold",
                          Number(parseFloat(e.currentTarget.value).toFixed(2)),
                        )
                      }
                    />
                  </FormGroup>
                  <h2 className="text-md text-gray-500">Time-Based Settings</h2>
                  <FormGroup
                    splitWidthInputs
                    description="Time interval in seconds to fetch metrics for evaluation"
                    label="Metrics Lookback Time Interval"
                    htmlFor="lookback-interval"
                  >
                    <Input
                      id="lookback-interval"
                      name="lookback-interval"
                      type="number"
                      value={nextPolicy.metricLookbackSeconds}
                      min="0"
                      max="3600"
                      placeholder="0 (Min), 3600 (Max)"
                      onChange={(e) =>
                        updatePolicy(
                          "metricLookbackSeconds",
                          parseInt(e.currentTarget.value, 10),
                        )
                      }
                    />
                  </FormGroup>
                  <FormGroup
                    splitWidthInputs
                    description="The number of seconds to wait after an automated scale to potentially scale up"
                    label="Scale Up Cooldown"
                    htmlFor="scale-up-cooldown"
                  >
                    <Input
                      id="scale-up-cooldown"
                      name="scale-up-cooldown"
                      type="number"
                      value={nextPolicy.postScaleUpCooldownSeconds}
                      min="0"
                      max="3600"
                      placeholder="0 (Min), 3600 (Max)"
                      onChange={(e) =>
                        updatePolicy(
                          "postScaleUpCooldownSeconds",
                          parseInt(e.currentTarget.value, 10),
                        )
                      }
                    />
                  </FormGroup>
                  <FormGroup
                    splitWidthInputs
                    description="The number of seconds to wait after an automated scale to potentially scale down"
                    label="Scale Down Cooldown"
                    htmlFor="scale-down-cooldown"
                  >
                    <Input
                      id="scale-down-cooldown"
                      name="scale-down-cooldown"
                      type="number"
                      value={nextPolicy.postScaleDownCooldownSeconds}
                      min="0"
                      max="3600"
                      placeholder="0 (Min), 3600 (Max)"
                      onChange={(e) =>
                        updatePolicy(
                          "postScaleDownCooldownSeconds",
                          parseInt(e.currentTarget.value, 10),
                        )
                      }
                    />
                  </FormGroup>
                  <FormGroup
                    splitWidthInputs
                    description="The number of seconds to wait after a general scale to potentially take another action"
                    label="Post Release Cooldown"
                    htmlFor="release-cooldown"
                  >
                    <Input
                      id="release-cooldown"
                      name="release-cooldown"
                      type="number"
                      value={nextPolicy.postReleaseCooldownSeconds}
                      min="0"
                      max="3600"
                      placeholder="0 (Min), 3600 (Max)"
                      onChange={(e) =>
                        updatePolicy(
                          "postReleaseCooldownSeconds",
                          parseInt(e.currentTarget.value, 10),
                        )
                      }
                    />
                  </FormGroup>
                  <h2 className="text-md text-gray-500">General Settings</h2>
                  <FormGroup
                    splitWidthInputs
                    label="Reset Advanced Settings to Defaults"
                    description="This will restore settings to their default values."
                    htmlFor="reset-button"
                  >
                    <div id="reset-button">
                      <ButtonIcon
                        icon={<IconRefresh variant="sm" />}
                        variant="white"
                        onClick={resetAdvancedSettings}
                      >
                        Reset to Defaults
                      </ButtonIcon>
                    </div>
                  </FormGroup>
                </div>
              </div>
            ) : null}
          </div>
          <hr />

          <div className="flex">
            <Button
              name="autoscaling"
              className="w-40 flex font-semibold"
              type="submit"
              disabled={!changesExist}
              isLoading={modifyLoader.isLoading}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </Box>
  );
};

const getScaleText = (op: DeployOperation) =>
  `${op.containerCount} x ${op.containerSize / 1024} GB ${
    getContainerProfileFromType(op.instanceProfile as InstanceClass).name ||
    op.instanceProfile
  } container${op.containerCount === 1 ? "" : "s"}`;

const LastScaleBanner = ({ serviceId }: { serviceId: string }) => {
  const current = useSelector((s) => selectServiceScale(s, { id: serviceId }));
  const prev = useSelector((s) =>
    selectPreviousServiceScale(s, { id: serviceId }),
  );
  const neverScaled = current.status === "unknown";
  const currentComplete = current.status === "succeeded";
  const action = pollServiceOperations({ id: serviceId });
  const loader = useLoader(action);

  const poller = useMemo(() => action, [serviceId]);
  const cancel = useMemo(() => cancelServicesOpsPoll(), []);
  usePoller({ action: poller, cancel });

  if (loader.isInitialLoading) {
    return null;
  }

  return (
    <Banner variant={currentComplete || neverScaled ? "info" : "progress"}>
      {neverScaled ? (
        "Never Scaled"
      ) : (
        <>
          <strong>
            {currentComplete ? "Last Scale" : "Scale in Progress"}:
          </strong>{" "}
          {prettyDateTime(current.createdAt)} from {getScaleText(prev)} to{" "}
          {getScaleText(current)}
        </>
      )}
    </Banner>
  );
};

export const AppDetailServiceScalePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id = "", serviceId = "" } = useParams();
  const [errors, validate] = useValidator<AppScaleProps, typeof validators>(
    validators,
  );
  useQuery(fetchApp({ id }));
  const [containerCount, setContainerCount] = useState(1);
  const [containerProfileType, setContainerProfileType] =
    useState<InstanceClass>(DEFAULT_INSTANCE_CLASS);
  const [containerSize, setContainerSize] = useState<number>(512);
  const app = useSelector((s) => selectAppById(s, { id }));
  useQuery(fetchService({ id: serviceId }));
  const service = useSelector((s) => selectServiceById(s, { id: serviceId }));
  const environment = useSelector((s) =>
    selectEnvironmentById(s, { id: app.environmentId }),
  );
  const stack = useSelector((s) =>
    selectStackById(s, { id: environment.stackId }),
  );
  const containerProfilesForStack = useSelector((s) =>
    selectContainerProfilesForStack(s, { id: environment.stackId }),
  );

  const action = scaleService({
    id: serviceId,
    containerCount,
    containerSize,
    containerProfile: containerProfileType,
  });
  const onSubmitForm = (e: SyntheticEvent) => {
    e.preventDefault();
    if (!validate({ containerCount })) return;
    dispatch(action);
  };
  const loader = useLoader(scaleService);

  useEffect(() => {
    setContainerCount(service.containerCount);
  }, [service.containerCount]);

  useEffect(() => {
    setContainerProfileType(service.instanceClass);
  }, [service.instanceClass]);

  useEffect(() => {
    if (service.containerMemoryLimitMb) {
      setContainerSize(service.containerMemoryLimitMb);
    }
  }, [service.containerMemoryLimitMb]);

  const changesExist =
    service.containerCount !== containerCount ||
    service.instanceClass !== containerProfileType ||
    service.containerMemoryLimitMb !== containerSize;

  useLoaderSuccess(loader, () => {
    navigate(appActivityUrl(app.id));
  });

  const currentContainerProfile = getContainerProfileFromType(
    service.instanceClass,
  );
  const requestedContainerProfile =
    getContainerProfileFromType(containerProfileType);
  const { pricePerHour: currentPricePerHour, pricePerMonth: currentPrice } =
    hourlyAndMonthlyCostsForContainers(
      service.containerCount,
      currentContainerProfile,
      service.containerMemoryLimitMb,
    );
  const { pricePerHour: estimatedPricePerHour, pricePerMonth: estimatedPrice } =
    hourlyAndMonthlyCostsForContainers(
      containerCount,
      requestedContainerProfile,
      containerSize,
    );

  const profileOptions = Object.keys(containerProfilesForStack).map(
    (profileType) => {
      const profile = getContainerProfileFromType(profileType as InstanceClass);
      return {
        label: profile.name,
        value: profileType,
      };
    },
  );

  const memoryContainerOptions = containerSizesByProfile(
    containerProfileType,
  ).map((containerSizeOption) => {
    return {
      label: `${containerSizeOption / 1024} GB`,
      value: `${containerSizeOption}`,
    };
  });

  const changeContainerProfile = (opt: SelectOption) => {
    const instClass = opt.value as InstanceClass;
    const profile = containerProfilesForStack[instClass];
    if (!profile) {
      return;
    }

    if (containerSize < profile.minimumContainerSize) {
      setContainerSize(profile.minimumContainerSize);
    }
    setContainerProfileType(instClass);
  };

  const setContainerScalingValues = () => {
    setContainerProfileType(service.instanceClass);
    setContainerSize(service.containerMemoryLimitMb);
    setContainerCount(service.containerCount);
  };

  return (
    <div className="flex flex-col gap-4">
      <LastScaleBanner serviceId={serviceId} />
      <VerticalAutoscalingSection serviceId={serviceId} stackId={stack.id} />
      <Box>
        <form onSubmit={onSubmitForm}>
          <div className="flex flex-col gap-2">
            {stack.verticalAutoscaling ? (
              <h1 className="text-lg text-gray-500 mb-4">Manual Scale</h1>
            ) : null}
            <FormGroup
              splitWidthInputs
              description="Optimize container performance with a custom profile."
              label="Container Profile"
              htmlFor="container-profile"
            >
              <Select
                id="container-profile"
                ariaLabel="container-profile"
                disabled={Object.keys(containerProfilesForStack).length <= 1}
                value={containerProfileType}
                onSelect={changeContainerProfile}
                options={profileOptions}
              />
            </FormGroup>
            <FormGroup
              splitWidthInputs
              description={`Horizontally scale this service by increasing the number of containers. A count of 2 or more will provide High Availability. 32 max count for ${
                getContainerProfileFromType(containerProfileType).name
              } profiles.`}
              label="Number of Containers"
              htmlFor="number-containers"
              feedbackMessage={errors.containerCount}
              feedbackVariant={errors.containerCount ? "danger" : "info"}
            >
              <Input
                id="number-containers"
                name="number-containers"
                type="number"
                value={containerCount}
                min="0"
                max="32"
                placeholder="0 (Min), 32 (Max)"
                onChange={(e) =>
                  setContainerCount(parseInt(e.currentTarget.value || "0", 10))
                }
              />
            </FormGroup>
            <FormGroup
              splitWidthInputs
              description="Specify the memory you wish to allow per container."
              label="Memory per Container"
              htmlFor="memory-container"
            >
              <Select
                id="memory-container"
                value={containerSize.toString()}
                onSelect={(opt) => setContainerSize(parseInt(opt.value))}
                options={memoryContainerOptions}
              />
            </FormGroup>
            <FormGroup
              splitWidthInputs
              description="CPU Share is determined by the selected Memory Limit and Container Profile."
              label="CPU Share per Container"
              htmlFor="cpu-share"
            >
              <Input
                id="number-containers"
                name="number-containers"
                className="disabled"
                type="text"
                disabled
                value={requestedContainerProfile.cpuShare * containerSize}
              />
            </FormGroup>
          </div>

          <div className="mt-2 mb-4 flex justify-between">
            <div>
              <Label>Pricing</Label>
              <p className="text-black-500">
                {service.containerCount} container
                {service.containerCount > 1 ? "s" : ""} x{" "}
                {service.containerMemoryLimitMb / 1024} GB x $
                {currentPricePerHour} per GB/hour
              </p>
            </div>
            <div>
              <p className="text-black-500">Current Estimated Monthly Cost</p>
              <p className="text-right text-lg text-green-400">
                ${currentPrice}
              </p>
            </div>
          </div>

          <hr />

          {changesExist ? (
            <div className="text-md font-semibold text-gray-900 mt-4">
              Pending Changes
            </div>
          ) : null}
          {containerProfileType !== service.instanceClass ? (
            <div className="my-3">
              <div className="text-md text-gray-900">Container Profile</div>
              <p className="text-black-500">
                Changed from {currentContainerProfile.name} to{" "}
                {requestedContainerProfile.name}
              </p>
            </div>
          ) : null}
          {containerCount !== service.containerCount ? (
            <div className="my-3">
              <div className="text-md text-gray-900">Container Count</div>
              <p className="text-black-500">
                Changed from {service.containerCount} to {containerCount}
              </p>
            </div>
          ) : null}
          {containerSize !== service.containerMemoryLimitMb ? (
            <div className="my-3">
              <div className="text-md text-gray-900">Container Size</div>
              <p className="text-black-500" id="container-size-txt">
                Changed from {service.containerMemoryLimitMb / 1024} GB to{" "}
                {containerSize / 1024} GB
              </p>
            </div>
          ) : null}
          {changesExist ? (
            <div className="my-3 flex justify-between">
              <div>
                <div className="text-md text-gray-900">Pricing</div>
                <p className="text-black-500">
                  {containerCount} container
                  {containerCount > 1 || containerCount === 0 ? "s" : ""} x{" "}
                  {containerSize / 1024} GB x ${estimatedPricePerHour} per
                  GB/hour
                </p>
              </div>
              <div>
                <p className="text-black-500">New Estimated Monthly Cost</p>
                <p className="text-right text-lg text-green-400">
                  ${estimatedPrice}
                </p>
              </div>
            </div>
          ) : null}

          <BannerMessages {...loader} />

          <div className="flex mt-4">
            <Button
              className="w-40 flex font-semibold"
              type="submit"
              disabled={!changesExist}
            >
              Save Changes
            </Button>

            {changesExist ? (
              <Button
                className="w-40 ml-2 flex font-semibold"
                onClick={setContainerScalingValues}
                variant="white"
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </Box>
    </div>
  );
};
