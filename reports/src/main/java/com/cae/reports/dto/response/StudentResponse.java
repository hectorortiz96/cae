package com.cae.reports.dto.response;

import com.cae.reports.model.Student;

public class StudentResponse {
    private String fullName;
    private String grade;
    private String contactemail1;
    private String contactemail2;

    public StudentResponse() {
    }

    public StudentResponse(String fullName, String grade, String contactemail1, String contactemail2) {
        this.fullName = fullName;
        this.grade = grade;
        this.contactemail1 = contactemail1;
        this.contactemail2 = contactemail2;
    }

    // Factory method to convert Student entity to StudentResponse DTO
    public static StudentResponse fromStudent(Student student) {
        return new StudentResponse(
                student.getFullName(),
                student.getGrade().getValue(),
                student.getContactemail1(),
                student.getContactemail2()
        );
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public String getContactemail1() {
        return contactemail1;
    }

    public void setContactemail1(String contactemail1) {
        this.contactemail1 = contactemail1;
    }

    public String getContactemail2() {
        return contactemail2;
    }

    public void setContactemail2(String contactemail2) {
        this.contactemail2 = contactemail2;
    }
}

