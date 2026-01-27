from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.models.submission import Submission
from app.models.test_case import TestCase, TestSuite
from app.models.assignment import Assignment
from app.services.sandbox import sandbox_executor
from app.core.logging import logger
import os


class AutoGradingService:
    """Autograding service for submissions"""
    
    def grade_submission(self, submission: Submission, db: Session) -> Dict[str, Any]:
        """
        Grade a submission by running all test cases
        
        Returns:
            Dict with test results and score
        """
        assignment = db.query(Assignment).filter(Assignment.id == submission.assignment_id).first()
        if not assignment:
            return {"error": "Assignment not found"}
        
        # Get all test suites for this assignment
        test_suites = db.query(TestSuite).filter(TestSuite.assignment_id == assignment.id).all()
        
        results = {
            "test_suites": [],
            "public_passed": 0,
            "public_total": 0,
            "private_passed": 0,
            "private_total": 0,
            "total_score": 0,
            "max_score": 0
        }
        
        for suite in test_suites:
            suite_result = self._run_test_suite(suite, submission, assignment, db)
            results["test_suites"].append(suite_result)
            
            if suite.visibility == "public":
                results["public_passed"] += suite_result["passed"]
                results["public_total"] += suite_result["total"]
            else:
                results["private_passed"] += suite_result["passed"]
                results["private_total"] += suite_result["total"]
            
            results["total_score"] += suite_result["score"]
            results["max_score"] += suite_result["max_score"]
        
        # Calculate percentage score
        if results["max_score"] > 0:
            percentage = (results["total_score"] / results["max_score"]) * 100
        else:
            percentage = 0
        
        results["percentage"] = percentage
        
        return results
    
    def _run_test_suite(
        self,
        test_suite: TestSuite,
        submission: Submission,
        assignment: Assignment,
        db: Session
    ) -> Dict[str, Any]:
        """Run all test cases in a suite"""
        test_cases = db.query(TestCase).filter(
            TestCase.test_suite_id == test_suite.id
        ).order_by(TestCase.order).all()
        
        suite_result = {
            "suite_name": test_suite.name,
            "visibility": test_suite.visibility,
            "test_cases": [],
            "passed": 0,
            "total": len(test_cases),
            "score": 0,
            "max_score": sum(tc.points for tc in test_cases)
        }
        
        for test_case in test_cases:
            case_result = self._run_test_case(
                test_case,
                submission.files_path,
                assignment.language
            )
            suite_result["test_cases"].append(case_result)
            
            if case_result["passed"]:
                suite_result["passed"] += 1
                suite_result["score"] += test_case.points
        
        return suite_result
    
    def _run_test_case(
        self,
        test_case: TestCase,
        code_path: str,
        language: str
    ) -> Dict[str, Any]:
        """Run a single test case"""
        result = {
            "test_name": test_case.name,
            "passed": False,
            "output": "",
            "expected": "",
            "error": "",
            "runtime": 0
        }
        
        try:
            # Execute code with test input
            execution_result = sandbox_executor.execute_code(
                code_path=code_path,
                language=language,
                test_input=test_case.input_data
            )
            
            result["output"] = execution_result["stdout"]
            result["error"] = execution_result["stderr"]
            result["runtime"] = execution_result["runtime"]
            result["expected"] = test_case.expected_output or ""
            
            # Check if output matches expected
            if execution_result["success"]:
                actual = execution_result["stdout"]
                expected = test_case.expected_output or ""
                
                # Apply comparison settings
                if test_case.ignore_whitespace:
                    actual = " ".join(actual.split())
                    expected = " ".join(expected.split())
                
                if test_case.ignore_case:
                    actual = actual.lower()
                    expected = expected.lower()
                
                result["passed"] = actual.strip() == expected.strip()
            
        except Exception as e:
            logger.error(f"Test case execution error: {str(e)}")
            result["error"] = str(e)
        
        return result


autograding_service = AutoGradingService()
