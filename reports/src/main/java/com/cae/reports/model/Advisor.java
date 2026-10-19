package com.cae.reports.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "advisor")
public class Advisor {

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Id
    @Column(name = "email", nullable = false, length = 100)
    private String email;

    @NotNull
    @Min(1)
    @Max(3)
    @Column(name = "grade", nullable = false)
    private Integer grade;

    public Advisor() {
    }

    public Advisor(String name, String email, Integer grade) {
        this.name = name;
        this.email = email;
        this.grade = grade;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Integer getGrade() {
        return grade;
    }

    public void setGrade(Integer grade) {
        this.grade = grade;
    }
}
