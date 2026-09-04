package com.cae.reports.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "student")
public class Student {

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(name = "grade", nullable = false, length = 10)
    private Grade grade;

    @Id
    @Column(name = "contactemail1", nullable = false, length = 100)
    private String contactemail1;

    @Column(name = "contactemail2", length = 100)
    private String contactemail2;

    public Student() {
    }

    public Student(String fullName, Grade grade, String contactemail1, String contactemail2) {
        this.fullName = fullName;
        this.grade = grade;
        this.contactemail1 = contactemail1;
        this.contactemail2 = contactemail2;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public Grade getGrade() {
        return grade;
    }

    public void setGrade(Grade grade) {
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

