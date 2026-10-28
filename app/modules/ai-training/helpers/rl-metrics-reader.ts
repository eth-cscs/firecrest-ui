/*************************************************************************
 Copyright (c) 2025, ETH Zurich. All rights reserved.

  Please, refer to the LICENSE file in the root directory.
  SPDX-License-Identifier: BSD-3-Clause
*************************************************************************/

// Reads the headline metrics of a run from its TensorBoard event files: Python source the job
// runs with the directory as its argument, printing a JSON object of metrics or nothing. Only
// the standard library, as the batch script runs outside the container. The names are those
// NeMo-RL logs; metrics it doesn't find are left out.
export const TENSORBOARD_METRICS_READER = String.raw`import json, math, os, statistics, struct, sys

# Reads the scalar summaries of the TensorBoard event files under a directory and prints the
# run's headline metrics as a JSON object, or nothing. Standard library only, Python 3.6+.


def varint(data, i):
    result = shift = 0
    while True:
        byte = data[i]
        i += 1
        result |= (byte & 0x7F) << shift
        shift += 7
        if byte < 0x80:
            return result, i


def fields(data):
    i = 0
    while i < len(data):
        key, i = varint(data, i)
        number, wire = key >> 3, key & 7
        if wire == 0:
            value, i = varint(data, i)
        elif wire == 1:
            value, i = data[i : i + 8], i + 8
        elif wire == 5:
            value, i = data[i : i + 4], i + 4
        elif wire == 2:
            size, i = varint(data, i)
            value, i = data[i : i + size], i + size
        else:
            return
        yield number, wire, value


# TFRecord framing: length, length CRC, data, data CRC. A file being written may end in a partial
# record, which is left out.
def records(data):
    i = 0
    while i + 12 <= len(data):
        size = struct.unpack("<Q", data[i : i + 8])[0]
        if i + 12 + size + 4 > len(data):
            return
        yield data[i + 12 : i + 12 + size]
        i += 12 + size + 4


def scalars(path, values):
    with open(path, "rb") as file:
        data = file.read()
    for record in records(data):
        step, summary = 0, None
        for number, wire, value in fields(record):
            if number == 2 and wire == 0:
                step = value
            elif number == 5 and wire == 2:
                summary = value
        if summary is None:
            continue
        for number, _, entry in fields(summary):
            if number != 1:
                continue
            tag = value = None
            for field, wire, content in fields(entry):
                if field == 1 and wire == 2:
                    tag = content.decode("utf-8", "replace")
                elif field == 2 and wire == 5:
                    value = struct.unpack("<f", content)[0]
            if tag is not None and value is not None and math.isfinite(value):
                values.setdefault(tag, {})[step] = value


def main(directory):
    values = {}
    for root, _, names in os.walk(directory):
        for name in names:
            if "tfevents" in name:
                try:
                    scalars(os.path.join(root, name), values)
                except (OSError, ValueError, IndexError, struct.error):
                    pass
    metrics = {}
    accuracy = values.get("validation/accuracy")
    if accuracy:
        metrics["val:accuracy"] = accuracy[max(accuracy)]
        if len(accuracy) > 1:
            metrics["val:accuracy_start"] = accuracy[min(accuracy)]
    step_time = values.get("timing/train/total_step_time")
    if step_time:
        metrics["steps"] = max(step_time)
        metrics["step_time_s"] = statistics.median(step_time.values())
    for tag, name in (
        ("performance/tokens_per_sec", "tokens_per_s"),
        ("performance/tokens_per_sec_per_gpu", "tokens_per_s_per_gpu"),
    ):
        if values.get(tag):
            metrics[name] = statistics.median(values[tag].values())
    if metrics:
        print(json.dumps({k: round(v, 6) for k, v in metrics.items()}, sort_keys=True, allow_nan=False))


if __name__ == "__main__":
    main(sys.argv[1])`
