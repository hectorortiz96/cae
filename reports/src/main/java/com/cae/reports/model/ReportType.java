package com.cae.reports.model;

public enum ReportType {
    OBSERVATION("Observación"),
    REPORT("Reporte");

    private final String value;

    ReportType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static ReportType fromValue(String value) {
        for (ReportType type : values()) {
            if (type.value.equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown report type: " + value);
    }
}
