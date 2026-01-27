from typing import Optional
from pydantic import BaseModel


class TestCaseBase(BaseModel):
    name: str
    description: Optional[str] = None
    input_data: Optional[str] = None
    expected_output: Optional[str] = None
    test_code: Optional[str] = None
    points: float = 1.0
    ignore_whitespace: bool = True
    ignore_case: bool = False
    order: int = 0


class TestCaseCreate(TestCaseBase):
    test_suite_id: int


class TestCase(TestCaseBase):
    id: int
    test_suite_id: int
    
    class Config:
        from_attributes = True


class TestSuiteBase(BaseModel):
    name: str
    description: Optional[str] = None
    test_type: str
    visibility: str
    timeout_seconds: int = 30
    memory_limit_mb: int = 512


class TestSuiteCreate(TestSuiteBase):
    assignment_id: int


class TestSuite(TestSuiteBase):
    id: int
    assignment_id: int
    
    class Config:
        from_attributes = True
