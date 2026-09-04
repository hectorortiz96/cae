package com.cae.reports.service;

import com.cae.reports.dto.response.StudentBatchImportResponse;
import com.cae.reports.model.Grade;
import com.cae.reports.model.Student;
import com.cae.reports.repository.StudentRepository;
import jakarta.transaction.Transactional;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.StringReader;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class StudentService {
    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    @Transactional
    public StudentBatchImportResponse importStudentsFromCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is required");
        }

        List<Student> studentsToCreate = new ArrayList<>();
        List<StudentBatchImportResponse.RowError> errors = new ArrayList<>();
        Set<String> fullNamesInFile = new HashSet<>();
        int totalRows = 0;

        try (BufferedReader reader = new BufferedReader(new StringReader(readCsvText(file)));
             CSVParser csvParser = CSVFormat.DEFAULT.builder()
                     .setIgnoreEmptyLines(true)
                     .setTrim(true)
                     .build()
                     .parse(reader)) {

            boolean headerChecked = false;

            for (CSVRecord record : csvParser) {
                int lineNumber = Math.toIntExact(record.getRecordNumber());

                if (!headerChecked) {
                    headerChecked = true;
                    if (isHeaderRow(record)) {
                        continue;
                    }
                }

                totalRows++;

                try {
                    Student student = parseStudent(record);
                    String normalizedFullName = normalize(student.getFullName());

                    if (fullNamesInFile.contains(normalizedFullName)) {
                        errors.add(new StudentBatchImportResponse.RowError(
                                lineNumber,
                                "Duplicate fullName in file: " + student.getFullName()
                        ));
                        continue;
                    }

                    if (studentRepository.existsByFullNameIgnoreCase(student.getFullName().trim())) {
                        errors.add(new StudentBatchImportResponse.RowError(
                                lineNumber,
                                "Student already exists for fullName: " + student.getFullName()
                        ));
                        continue;
                    }

                    fullNamesInFile.add(normalizedFullName);
                    studentsToCreate.add(student);
                } catch (IllegalArgumentException ex) {
                    errors.add(new StudentBatchImportResponse.RowError(lineNumber, ex.getMessage()));
                }
            }
        } catch (IOException ex) {
            throw new IllegalArgumentException("Unable to read CSV file", ex);
        }

        if (!studentsToCreate.isEmpty()) {
            studentRepository.saveAll(studentsToCreate);
        }

        return new StudentBatchImportResponse(
                totalRows,
                studentsToCreate.size(),
                errors.size(),
                errors
        );
    }

    private String readCsvText(MultipartFile file) throws IOException {
        byte[] rawBytes = stripUtf8Bom(file.getBytes());

        try {
            return decodeUtf8(rawBytes);
        } catch (CharacterCodingException ex) {
            return new String(rawBytes, Charset.forName("windows-1252"));
        }
    }

    private String decodeUtf8(byte[] bytes) throws CharacterCodingException {
        return StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT)
                .decode(ByteBuffer.wrap(bytes))
                .toString();
    }

    private byte[] stripUtf8Bom(byte[] bytes) {
        if (bytes.length >= 3
                && (bytes[0] & 0xFF) == 0xEF
                && (bytes[1] & 0xFF) == 0xBB
                && (bytes[2] & 0xFF) == 0xBF) {
            byte[] withoutBom = new byte[bytes.length - 3];
            System.arraycopy(bytes, 3, withoutBom, 0, withoutBom.length);
            return withoutBom;
        }

        return bytes;
    }

    private boolean isHeaderRow(CSVRecord record) {
        if (record.size() < 3) {
            return false;
        }

        String first = normalize(record.get(0));
        String second = normalize(record.get(1));
        String third = normalize(record.get(2));

        return "fullname".equals(first) && "grade".equals(second) && "contactemail1".equals(third);
    }

    private Student parseStudent(CSVRecord record) {
        if (record.size() < 3 || record.size() > 4) {
            throw new IllegalArgumentException("Each row must contain 3 or 4 columns: fullName, grade, contactemail1, contactemail2");
        }

        String fullName = toSentenceCase(record.get(0).trim());
        String gradeValue = record.get(1).trim();
        String contactemail1 = record.get(2).trim();
        String contactemail2 = record.size() == 4 ? record.get(3).trim() : "";

        Grade grade = Grade.fromValue(gradeValue);

        Student student = new Student();
        student.setFullName(fullName);
        student.setGrade(grade);
        student.setContactemail1(contactemail1);
        student.setContactemail2(contactemail2.isEmpty() ? null : contactemail2);

        return student;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private String toSentenceCase(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        String lowerCased = value.toLowerCase();
        StringBuilder formatted = new StringBuilder(lowerCased.length());
        boolean capitalizeNext = true;

        for (int i = 0; i < lowerCased.length(); i++) {
            char ch = lowerCased.charAt(i);

            if (capitalizeNext && Character.isLetter(ch)) {
                formatted.append(Character.toUpperCase(ch));
                capitalizeNext = false;
            } else {
                formatted.append(ch);
                if (Character.isLetter(ch)) {
                    capitalizeNext = false;
                }
            }

            if (ch == ' ' || ch == '-' || ch == '\'') {
                capitalizeNext = true;
            }
        }

        return formatted.toString();
    }

    public List<Student> getStudentsByGrade(String grade) {
        Grade parsedGrade = Grade.fromValue(grade.trim());
        return studentRepository.findByGrade(parsedGrade);
    }

    public List<Student> getStudentsByName(String name) {
        return studentRepository.findByFullNameContainingIgnoreCase(name.trim());
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    @Transactional
    public void deleteAllStudents() {
        studentRepository.deleteAllInBatch();
    }
}
