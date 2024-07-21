export class Resources {
    resources = new Map<string, number>();

    constructor(resources?: Record<string, number>) {
        if (resources) {
            for (const [k, v] of Object.entries(resources)) {
                this.resources.set(k, v);
            }
        }
    }

    modifyResource(resource: string, amount: number) {
        this.resources[resource] = (this.resources[resource] ?? 0) + amount;
        if (this.resources[resource] <= 0) {
            delete this.resources[resource];
        }
    }

    modifyResources(resources: Resources | Record<string, number>) {
        resources = resources instanceof Resources ? resources : new Resources(resources);

        for (const [k, v] of Object.entries(resources)) {
            this.modifyResource(k, v);
        }
    }

    hasEnoughResource(required: Resources | Record<string, number>) {
        required = required instanceof Resources ? required : new Resources(required);
        for (const [resource, amount] of required.resources) {
            if (this.resources[resource] < amount) {
                return false;
            }
        }
        return true;
    }

    toString() {
        return Object.entries(this.resources)
            .map(([k, v]) => `${k}:${v}`)
            .join(", ");
    }
}
