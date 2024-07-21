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

    meetsRequirements(requirements: Record<string, number>) {
        for (const key in requirements) {
            if (this[key] < requirements[key]) {
                return false;
            }
        }
        return true;
    }


    withinRange(range: VariableRange) {
        const {min, max} = range;
        for (const key in this.values) {
            // min or max may not have the given key, only fail if there is key but value is out of range
            if (key in min && this.values[key] < min[key]) return false;
            if (key in max && this.values[key] > max[key]) return false;
        }
        return true;
    }
}


export type VariableRange = {min?: Record<string, number>, max?: Record<string, number>};