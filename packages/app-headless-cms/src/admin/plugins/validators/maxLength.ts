import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin } from "~/types";

const plugin: CmsModelFieldValidatorPlugin = {
    type: "cms-model-field-validator",
    name: "cms-model-field-validator-max-length",
    validator: {
        name: "maxLength",
        validate: async (value, validator) => {
            const maxLengthValue = validator.settings.value;
            if (typeof maxLengthValue === "undefined") {
                return true;
            }
            return validation.validate(value, `maxLength:${maxLengthValue}`);
        }
    }
};
export default plugin;
