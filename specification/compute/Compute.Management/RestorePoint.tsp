import "@azure-tools/typespec-azure-core";
import "@azure-tools/typespec-azure-resource-manager";
import "@typespec/openapi";
import "@typespec/rest";
import "./models.tsp";
import "./RestorePointCollection.tsp";

using TypeSpec.Rest;
using Azure.ResourceManager;
using TypeSpec.Http;
using TypeSpec.OpenAPI;

namespace Microsoft.Compute;
/**
 * Restore Point details.
 */
@parentResource(RestorePointCollection)
model RestorePoint
  is Azure.ResourceManager.ProxyResource<RestorePointProperties> {
  ...ResourceNameParameter<
    Resource = RestorePoint,
    KeyName = "restorePointName",
    SegmentName = "restorePoints",
    NamePattern = ""
  >;
}

@armResourceOperations
interface RestorePoints {
  /**
   * The operation to get the restore point.
   */
  get is ComputeResourceRead<
    RestorePoint,
    Parameters = {
      /**
       * The expand expression to apply on the operation. 'InstanceView' retrieves information about the run-time state of a restore point.
       */
      @query("$expand")
      $expand?: RestorePointExpandOptions;
    }
  >;

  /**
   * The operation to create the restore point. Updating properties of an existing restore point is not allowed
   */
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-put-operation-response-codes"
  create is ComputeResourceCreateOrReplaceAsync<
    RestorePoint,
    Response = ArmResourceCreatedResponse<
      RestorePoint,
      ArmLroLocationHeader & Azure.Core.Foundations.RetryAfterHeader
    >
  >;

  /**
   * The operation to delete the restore point.
   */
  #suppress "deprecated" "For backward compatibility"
  #suppress "@azure-tools/typespec-azure-resource-manager/arm-delete-operation-response-codes" "For backward compatibility"
  #suppress "@azure-tools/typespec-azure-core/no-response-body" "For backward compatibility"
  delete is ComputeResourceDeleteAsync<RestorePoint>;
}

@@doc(RestorePoint.name, "The name of the restore point.");
@@doc(RestorePoint.properties, "The restore point properties.");
@@doc(RestorePoints.create::parameters.resource,
  "Parameters supplied to the Create restore point operation."
);
