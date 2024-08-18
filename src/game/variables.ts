export class Variables {
    values: Record<string, number> = {};
    static fromRecord(record: Record<string, number>) {
        const vars = new Variables();
        for (const key in record) {
            vars.values[key] = record[key];
        }
        return vars;
    }

    alterValues(alterations: Variables | Record<string, number>, force: boolean = false) {
        alterations = alterations instanceof Variables ? alterations.values : alterations;
        for (const key in alterations) {
            this.alterValue(key, alterations[key], force);
        }
    }

    alterValue(key: string, value: number, force?: boolean) {
        if (key in this.values && !force) {
            this.values[key] += value;
        } else {
            this.values[key] = value;
        }
    }

    meetsRequirements(requirements: Record<string, number>, invert: boolean = false) {
        for (const key in requirements) {
            if (invert) {
                if (this[key] < -requirements[key]) {
                    return false;
                }
            } else {
                if (this[key] < requirements[key]) {
                    return false;
                }
            }
        }
        return true;
    }

    withinRange(range: VariableRange) {
        const { min, max } = range;
        for (const key in this.values) {
            if (min && key in min && this.values[key] < min[key]) return false;
            if (max && key in max && this.values[key] > max[key]) return false;
        }
        return true;
    }

    static toString(values: Record<string, number>) {
        let str = [];
        for (const key in values) {
            str.push(`${key}: ${values[key]}`);
        }

        return str.join(", ");
    }

    static invert(values: Record<string, number>) {
        const result: Record<string, number> = {};
        for (const key in values) {
            result[key] = -values[key];
        }
        return result;
    }

    toString() {
        return Variables.toString(this.values);
    }
}

export type VariableRange = { min?: Record<string, number>; max?: Record<string, number> };
