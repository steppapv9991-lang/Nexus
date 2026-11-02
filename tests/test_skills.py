"""Tests for SkillManager."""

import pytest
import tempfile
from pathlib import Path

from nexus_core.skill_manager import SkillManager, Skill, SkillParameter


@pytest.fixture
def skill_manager():
    return SkillManager()


def test_builtin_skills_registered(skill_manager):
    """Test that builtin skills are registered."""
    assert "read_file" in skill_manager.skills
    assert "write_file" in skill_manager.skills
    assert "list_directory" in skill_manager.skills
    assert "search_code" in skill_manager.skills
    assert "run_command" in skill_manager.skills


def test_skill_to_openai_tool(skill_manager):
    """Test conversion to OpenAI tool format."""
    skill = skill_manager.skills["read_file"]
    tool = skill.to_openai_tool()
    
    assert tool["type"] == "function"
    assert tool["function"]["name"] == "read_file"
    assert "parameters" in tool["function"]
    assert "properties" in tool["function"]["parameters"]


def test_auto_select_tools(skill_manager):
    """Test auto tool selection."""
    selected = skill_manager.auto_select_tools("read a file")
    
    # Should include read_file
    assert any(s.name == "read_file" for s in selected)


def test_load_from_yaml():
    """Test loading skills from YAML."""
    yaml_content = """
skills:
  - name: "test_skill"
    description: "A test skill"
    category: "testing"
    risk_level: "low"
    parameters:
      - name: "input"
        type: "string"
        description: "Input parameter"
        required: true
"""
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
        f.write(yaml_content)
        yaml_path = f.name
    
    try:
        manager = SkillManager()
        # This will fail because no handler is defined, but tests the parsing
        loaded = manager.load_from_yaml(yaml_path)
        # Should not crash even if handler is missing
    finally:
        Path(yaml_path).unlink()


@pytest.mark.asyncio
async def test_builtin_read_file():
    """Test builtin read_file skill."""
    with tempfile.NamedTemporaryFile(mode='w', delete=False) as f:
        f.write("line 1\nline 2\nline 3")
        file_path = f.name
    
    try:
        result = await SkillManager._builtin_read_file(file_path)
        assert "line 1" in result
        assert "line 2" in result
    finally:
        Path(file_path).unlink()


@pytest.mark.asyncio
async def test_builtin_write_file():
    """Test builtin write_file skill."""
    with tempfile.TemporaryDirectory() as tmpdir:
        file_path = Path(tmpdir) / "test.txt"
        
        result = await SkillManager._builtin_write_file(
            str(file_path), 
            "test content"
        )
        
        assert "Successfully wrote" in result
        assert file_path.exists()
        assert file_path.read_text() == "test content"


@pytest.mark.asyncio
async def test_builtin_list_dir():
    """Test builtin list_directory skill."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create some files
        (Path(tmpdir) / "file1.txt").touch()
        (Path(tmpdir) / "file2.txt").touch()
        
        result = await SkillManager._builtin_list_dir(tmpdir)
        
        assert "file1.txt" in result
        assert "file2.txt" in result
