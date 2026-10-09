package com.cae.reports.dto.request;

public class ResendReportEmailRequest {
    private String pdfBase64;
    private String pdfFileName;
    private String pdfMimeType;

    public String getPdfBase64() {
        return pdfBase64;
    }

    public void setPdfBase64(String pdfBase64) {
        this.pdfBase64 = pdfBase64;
    }

    public String getPdfFileName() {
        return pdfFileName;
    }

    public void setPdfFileName(String pdfFileName) {
        this.pdfFileName = pdfFileName;
    }

    public String getPdfMimeType() {
        return pdfMimeType;
    }

    public void setPdfMimeType(String pdfMimeType) {
        this.pdfMimeType = pdfMimeType;
    }
}
